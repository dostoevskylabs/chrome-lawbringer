/*
 * Chrome Lawbringer
 * 
 * @author dostoevskylabs
 */
let instance 		= undefined;
let currentHostname 	= undefined;
let currentReport 	= undefined;
let whitelist 		= [];
let blacklist 		= [];

/**
 * Send data to content script
 * 
 * @param {object} data 
 */
function sendContentEvent ( data ) {
	if ( instance === undefined ) return false;
	instance.postMessage( data );
	return true;
}

/**
 * Return a hostname from a given url
 * 
 * @param {string} url 
 */
function getHost ( url ) {
	return ( url.indexOf("://") > -1 ? url.split("/")[2] : url.split("/")[0] ).split(":")[0].split("?")[0];
}

/**
 * Add an item to the whitelist
 * 
 * @param {string} item 
 */
function addToWhitelist( item ) {
	if ( !whitelist.includes( item ) ) {
		whitelist.push( item );
		return true;
	}
	return false;
}

/**
 * Add an item to the blacklist
 * 
 * @param {string} item 
 */
function addToBlacklist ( item ) {
	if ( !blacklist.includes( item ) ) {
		blacklist.push( item );
		return true;
	}
	return false;
}

/**
 * Kill the currently focussed tab
 * 
 */
function killTab () {
	chrome.tabs.query( {currentWindow: true, active : true}, function( tab ) {
		chrome.processes.getProcessIdForTab( tab[0].id, function ( processId ) {
			chrome.processes.terminate( processId, function ( terminated ) {
				// if termination was sucessful
				if ( terminated ) {
					return true;
				}
				return false;
			} );
		} );	
	});	
}

/**
 * Generate notifications
 * 
 * hacky and lame
 * 
 * @param {string} type 
 * @param {string} title 
 * @param {string} message 
 * @param {array} items 
 */
function createNotification ( type, title, message, items = undefined ) {
	switch ( type ) {
		case "requestPermission":
			chrome.notifications.create("requestPermission", {
				type: "list",
				title: title,
				message: message,
				iconUrl: "icons/test-48.png",
				requireInteraction: true,
				items: items,
				buttons: [
					{title: "Allow"},
					{title: "Reject"}
				]
			}, function(){});
		break;

		case "viewReport":
			chrome.notifications.create("viewReport", {
				type: "basic",
				title: title,
				message: message,
				iconUrl: "icons/test-48.png",		
				buttons: [
					{title: "View Report"},
					{title: "Dismiss"}
				]
			}, function(){});
		break;

		case "alertBlocked":
			chrome.notifications.create("alertBlocked", {
				type: "basic",
				title: title,
				message: message,
				iconUrl: "icons/test-48.png",
				buttons: [
					{title: "(not implemented) Remove Blacklist"}
				]
			}, function(){});
		break;

		default:
			console.log("Invalid Notification ID");
	}

}

/**
 * Check hostname against whitelist/blacklist
 * 
 * @param {string} hostname 
 */
function checkStatus ( hostname ) {
	if ( whitelist.includes( hostname ) ) {
		// hostname is whitelisted, send permission true to content script
		sendContentEvent({ type:"permission", message:true	});
		return true;
	} else if ( blacklist.includes( hostname ) ) {
		// hostname is blacklisted

		// alert user
		createNotification(
			"alertBlocked",
			hostname,
			`Website is blacklisted`
		);

		// send permission false to content script
		sendContentEvent({ type:"permission", message:false });

		// kill tab
		killTab();
		return true;
	}

	// not in whitelist or blacklist, return false
	return false;
}

/**
 * Parse JSON data sent from the VT API and present it to user
 * 
 * @param {object} data 
 */
function parseVtResults ( data ) {
	// store safe hostname
	let hostname = getHost( data.attributes.url );

	// rudimentary check against data
	// if reputation is 0 or higher, and the last_analysis had 0 malicious entries we'll
	// add to whitelist without user interaction
	if ( data.attributes.reputation >= 0 && data.attributes.last_analysis_stats.malicious === 0	) {
		addToWhitelist( getHost( data.attributes.url) );
		sendContentEvent({ type:"message", message:true	});
		return true;
	}

	// if the above was not true, let's let the user know what is going on
	// and allow them to view the VT report
	// and add the host to a whitelist/blacklist

	// request permission
	createNotification(
		"requestPermission",
		"Potentially Harmful Website",
		``,
		[{ title: "User Rating", message: `${data.attributes.last_analysis_stats.malicious} malicious / ${data.attributes.last_analysis_stats.harmless} harmless` }]
	);

	// view vt report
	createNotification(
		"viewReport",
		"Virus Total",
		`Website is listed with a reputation of ${data.attributes.reputation}`
	);

	return true;
}

/**
 * Check stats of a VT entry so we can provide the user with information
 * 
 * To make an informed decesion
 * 
 * @param {object} data 
 */
function checkVtStats ( data ) {
	// store the analysis ID
	let id = data.id.split("-")[1];
	/**
	 * Store reference of current report, this is hacky
	 * However I can't find a way to pass this data through to the notification
	 * 
	 * once I figure that out this global variable will be removed.
	 */	
	currentReport = `https://www.virustotal.com/en/url/${id}/analysis/`;

	// make a GET request using fetch api to VT
	fetch( `https://www.virustotal.com/ui/urls/${id}`, {
		method	: 'GET',
		mode	: 'cors',
	}).then( function ( response ) {
		// Too many Requests error
		if ( response.status === 429 ) {
			console.log("Too many requests");
			return false;
		} else {
			// return JSON of response
			return response.json();
		}
	}).then( function ( obj ) {
		// is the object real?
		if ( obj.data === undefined ) {
			return false;
		}
		
		// stage 3 parse the results
		parseVtResults(obj.data);
	});
}

/**
 *  Check for the existence of a VT Analysis for a domain
 * 
 * @param {string} url 
 */
function checkVtUrl ( url ) {
	// store hostname of URL
	let hostname = getHost( url );
	if ( checkStatus( hostname ) ) return true; // handle whitelist/blacklist
	/**
	 * Store reference of current hostname, this is hacky
	 * However I can't find a way to pass this data through to the notification
	 * 
	 * once I figure that out this global variable will be removed.
	 */
	currentHostname = hostname;

	// make a POST request using fetch api to VT
	fetch( 'https://www.virustotal.com/ui/urls', {
		method	: 'POST',
		mode	: 'cors',
		headers	: new Headers({	'Content-Type': 'application/x-www-form-urlencoded'	}),
		body	: `url=${hostname}` // query for this hostname
	}).then( function ( response ) {
		// Too many Requests error
		if ( response.status === 429 ) {
			console.log("Too many requests");
			return false;
		} else {
			// return JSON of response
			return response.json();
		}
	}).then( function ( obj ) {
		// is the object real?
		if ( obj.data === undefined ) {
			return false;
		}

		// stage 2, check vt stats for the analysis
		checkVtStats( obj.data );
	});
}

/**
 * Listen for connections from our content script
 */
chrome.runtime.onConnect.addListener( function ( port ) {
	console.assert ( port.name == "lawbringer" ); // if the port.name is not lawbringer, exit
	instance = port; // create a reference to this port
	instance.postMessage( {	type : "init", whitelist : whitelist } ); // send our whitelist to content script
	instance.onMessage.addListener( function ( request, sender ) {
		// handle request from content script
		switch ( request.data.type ) {
			// check virus total for a hostname
			case "queryVirusTotal":
				checkVtUrl( request.data.item );
			break;
			
			// unknown request
			default:
				console.log("Unhandled Request Type");
		}
	});
});

/**
 * Handle notification button clicks
 */
chrome.notifications.onButtonClicked.addListener( function ( notificationId, buttonId ) {
	// clear notification when clicked
	chrome.notifications.clear(notificationId, function(){
		// handle notification types
		switch ( notificationId ) {
			case "requestPermission":
				if ( buttonId === 0 ) {
					// allow
					addToWhitelist(currentHostname);
					checkStatus(currentHostname);
				} else if ( buttonId === 1 ) {
					// reject
					addToBlacklist(currentHostname);
					checkStatus(currentHostname);				
				}
			break;
	
			case "viewReport":
				if ( buttonId === 0 ) {
					// view report
					window.open(currentReport, '_blank').focus();
				}
			break;
	
			// unknown notification type
			default:
				console.log("Unknown Notification ID");
		}
	});
});

/**
 * Watch tab CPU usage and terminate if it exceeds a threshhold of 200%
 * 
 * Eventually this will be manageable through settings.
 */
chrome.processes.onUpdated.addListener( function ( processes ) {
	for ( tabId in processes ) {
		switch ( processes[tabId].id ) {
			// ignore special tabs
			case 0:
			case 2:
			case 42:
			break;
			
			// otherwise watch the tab's usage
			default:
				// if the tab's cpu usage exceeds 200.0%
				if ( processes[tabId].cpu > 200.0 ) {
					// template for data to log to the extensions console
					let template =  `Terminated tab '${tabId}' due to exceeded resource usage. / ${processes[tabId].tasks[0].title} / CPU: ${processes[tabId].cpu}%`;
					// terminate the process
					chrome.processes.terminate( processes[tabId].id, function ( terminated ) {
						if ( terminated ) {
							// create notification to let user know which tab was killed
							chrome.notifications.create("", {
								type: "basic",
								title: "Chrome Lawbringer",
								message: template,
								iconUrl: "icons/test-48.png"
							}, function(){});
							return true;
						}
						return false;
					});
				}
		}
	}
});

/**
 * Intercept headers sent to https://www.virustotal.com
 * and overwrite the origin to https://www.virustotal.com
 * 
 * This is a hacky bypass to fix bad request errors from the VTAPI
 */
chrome.webRequest.onBeforeSendHeaders.addListener( function ( details ) {
	let found = false; // let's us know if we overwrote an existing origin header	
	for (var i = 0; i < details.requestHeaders.length; ++i) {
		if (details.requestHeaders[i].name === 'Origin') {
			found = true; // update
			details.requestHeaders[i].value = "https://www.virustotal.com"; // update
			break;
		}
	}
	if ( !found ) { // no header found
		details.requestHeaders.push( { name:'Origin', value:'https://www.virustotal.com' } );
	}
	return {requestHeaders: details.requestHeaders};
}, {urls: ["<all_urls>"]}, ["requestHeaders", "blocking"]);

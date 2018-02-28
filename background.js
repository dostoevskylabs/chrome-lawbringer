/*
 * Chrome Lawbringer
 * 
 * @author dostoevskylabs
 */

// save our channel
let instance = undefined;
let currentHostname = undefined;
let currentReport = undefined;
let whitelist = [];
let blacklist = [];

function sendContentEvent ( data ) {
	if ( instance === undefined ) return false;
	instance.postMessage( data );
	return true;
}

function getHost ( url ) {
	let hostname = undefined;
	if ( url.indexOf("://") > -1 ) {
		hostname = url.split('/')[2];
	} else {
		hostname = url.split('/')[0];
	}
	hostname = hostname.split(':')[0];
	hostname = hostname.split('?')[0];
	return hostname;
}

function addToWhitelist( item ) {
	if ( !whitelist.includes( item ) ) whitelist.push( item );
}

function addToBlacklist( item ) {
	if ( !blacklist.includes( item ) ) blacklist.push( item );
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

function parseVtResults ( data ) {
	let hostname = getHost( data.attributes.url );

	if ( data.attributes.reputation >= 0 && data.attributes.last_analysis_stats.malicious === 0	) {
		addToWhitelist( getHost( data.attributes.url) );
		sendContentEvent({
			type:"message",
			message:true
		});
		return true;
	}

	chrome.notifications.create("requestPermission", {
		type: "list",
		title: "Chrome Lawbringer",
		message: "PIE",
		iconUrl: "icons/test-48.png",
		requireInteraction: true,
		items: [
			{
				title: "User Rating",
				message: `${data.attributes.last_analysis_stats.malicious} malicious / ${data.attributes.last_analysis_stats.harmless} harmless`
			}
		],
		buttons: [
			{title: "Allow"},
			{title: "Reject"}
		]
	}, function(){});

	chrome.notifications.create("viewReport", {
		type: "basic",
		title: "Chrome Lawbringer",
		message: `Website is listed with a reputation of ${data.attributes.reputation}`,
		iconUrl: "icons/test-48.png",		
		buttons: [
			{title: "View Report"},
			{title: "Dismiss"}
		]
	}, function(){});

	return true;
}

function queryVtUrl ( url ) {
	let hostname = getHost( url );
	currentHostname = hostname;

	if ( whitelist.includes( currentHostname ) ) {
		sendContentEvent({
			type:"message",
			message:true
		});
		return true;
	} else if ( blacklist.includes( currentHostname ) ) {
		chrome.notifications.create("", {
			type: "basic",
			title: "Chrome Lawbringer",
			message: `Website is blacklisted`,
			iconUrl: "icons/test-48.png",
			buttons: [
				{title: "Remove Blacklist"}
			]
		}, function(){});
		sendContentEvent({
			type:"message",
			message:false
		});
		addToBlacklist(hostname);
		return true;
	}

	fetch('https://www.virustotal.com/ui/urls', {
		method: 'POST',
		mode: 'cors',
		headers: new Headers({
		'Content-Type': 'application/x-www-form-urlencoded'
		}),
		body: `url=${hostname}`
	}).then(function(response) {
		if ( response.status === 429 ) {
			console.log("Too many requests");
			return false;
		} else {
			return response.json();
		}
	}).then(function(data) {
		if ( data === undefined ) {
			return false;
		}
		let id = data.data.id.split("-")[1];
		currentReport = `https://www.virustotal.com/en/url/${id}/analysis/`;
		fetch(`https://www.virustotal.com/ui/urls/${id}`, {
			method: 'GET',
			mode: 'cors',
		}).then(function(response){
			return response.json();
		}).then(function(data){
			parseVtResults(data.data);
		});
	});
}

chrome.notifications.onButtonClicked.addListener(function( notificationId, buttonId ) {
	chrome.notifications.clear(notificationId, function(){
		switch ( notificationId ) {
			case "requestPermission":
				if ( buttonId === 0 ) {
					addToWhitelist(currentHostname);
					sendContentEvent({
						type:"message",
						message:true
					});
				} else if ( buttonId === 1 ) {
					addToBlacklist(currentHostname);
					sendContentEvent({
						type:"message",
						message:false
					});					
				}
			break;
	
			case "viewReport":
				if ( buttonId === 0 ) {
					window.open(currentReport, '_blank').focus();
				}
			break;
	
			default:
				console.log("Unknown Notification ID");
		}
	});
});

// overwrite origin when accessing virustotal
chrome.webRequest.onBeforeSendHeaders.addListener( function ( details ) {
	let found = false;	
	for (var i = 0; i < details.requestHeaders.length; ++i) {
		if (details.requestHeaders[i].name === 'Origin') {
			found = true;
			details.requestHeaders[i].value = "https://www.virustotal.com";
			break;
		}
	}
	if ( !found ) {
		details.requestHeaders.push({name:'Origin', value:'https://www.virustotal.com'});
	}
	return {requestHeaders: details.requestHeaders};
}, {urls: ["<all_urls>"]}, ["requestHeaders", "blocking"]);



// listen for connections
chrome.runtime.onConnect.addListener( function ( port ) {
	console.assert ( port.name == "lawbringer" );
	instance = port;
	instance.postMessage( {
		type		: "init",
		whitelist	: whitelist
	} );	
	instance.onMessage.addListener( function ( request, sender ) {
		// handle request type
		switch ( request.data.type ) {
			case "queryVirusTotal":
				queryVtUrl( request.data.item );
			break;
			
			default:
				console.log("Unhandled Request Type");
		}
	});
});


// listen for changes in cpu usage
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
					let template =  `
					Terminated '${tabId}' due to exceeded resource usage.
					${processes[tabId].tasks[0].title}
					CPU: ${processes[tabId].cpu}
					`;
					instance.postMessage( { type : "message", content : template } );

					// terminate the process
					// and log the data stored in the template above
					chrome.processes.terminate( processes[tabId].id, function ( terminated ) {
						if ( terminated ) {
							return true;
						}

						return false;
					});
				}
		}
	}
});

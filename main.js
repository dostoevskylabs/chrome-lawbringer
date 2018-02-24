/*
 * Chrome Lawbringer
 * 
 * @author dostoevskylabs
 */
console.log("Chrome Lawbringer extension loaded.");
let debug = true;
// connect to our background script to listen for messages
let instance = chrome.runtime.connect( { name : "lawbringer" } );
let whitelist = [];
let blacklist = [];


// print to console
function print( message ) {
	if ( debug ) console.log( message );
}

// send to background script
function sendBackgroundEvent ( data ) {
	instance.postMessage( { data : data }, function ( response ) {
		print(response);
	});
}

// send to page
function sendClientEvent ( data ) {
	let event = new CustomEvent( "allowProtocol", { detail : {data : data } } );
	window.dispatchEvent( event );
}

// listen for messages from our background script
instance.onMessage.addListener( function( data ) {
	// handle response type
	switch ( data.type ) {
		// init procedure
		case "init":
			whitelist = data.whitelist;
			blacklist = data.blacklist;
			loaded();
		break;

		case "message":
			print( data.content );
			alert( data.content );
		break;

		default:
			print("Unhandled Response Type.");
	}
});

// defer until background responds with our init case
function loaded () {
	window.addEventListener( 'queryVirusTotal', function ( event ) {
		let hostname = event.detail.host;
	
		print(`[${hostname}] Checking host against Virus Total.`);
		if ( whitelist.includes( hostname ) ) {
			let template = `[${hostname}] Page loaded because it is in good standing.`;
			print( template );
	
			return sendClientEvent(true);
		} else if ( blacklist.includes( hostname ) ) {
			let template = `[${hostname}] Request to load page was blocked by Chrome Lawbringer.`;
			alert( template );
			print( template );
	
			sendBackgroundEvent( {
				type : "blacklist",
				item : hostname
			} );
	
			return sendClientEvent( false );
		}
	
		let parseResponse = function () {
			if ( xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200 ) {
				let result = JSON.parse( xhr.responseText ) || undefined;
	
				if ( result === undefined ) {
					let template = `[${hostname}] Page added to whitelist.`;
					print( template );
	
					sendBackgroundEvent( {
						type : "whitelist",
						item : hostname
					} );	
	
					whitelist.push( hostname );
					return sendClientEvent( true );
				}
	
				if ( result.hasOwnProperty( "detected_urls" ) ) {
					if ( result['detected_urls'].length === 0  || result['detected_urls'][0].positives < 3 ) {
						let template = `[${hostname}] Page added to whitelist.`;
						print( template );
	
						sendBackgroundEvent( {
							type : "whitelist",
							item : hostname
						} );
	
						whitelist.push( hostname );
						return sendClientEvent( true );
					}
				} else {
					let template = `[${hostname}] Page added to whitelist.`;
					print( template );
	
					sendBackgroundEvent( {
						type : "whitelist",
						item : hostname
					} );
	
					whitelist.push( hostname );
					return sendClientEvent( true );
				}
	
				// log the top 5 detectons from VT
				let detections = [];
				for ( let i = 0; i < 5; i++ ) {
					if ( result['detected_urls'][i] !== undefined ) {
						detections.push( {
							url 		: result.detected_urls[i].url,
							positives 	: result.detected_urls[i].positives,
							total 		: result.detected_urls[i].total,
							scan_date 	: result.detected_urls[i].scan_date,
						} );
					}
				}
	
				// build our template
				let template = `Forcepoint ThreatSeeker category: ${result["Forcepoint ThreatSeeker category"]}\n`;
				template += `----------------------------------------------\n`;
				for ( item of detections ) {
					template += `Detection ratio: ${item.positives}/${item.total}\n`;
					template += `Associated URL: ${item.url}\n`;
				}
				template += `----------------------------------------------\n`;
				if ( result.hasOwnProperty("undetected_urls") ) {
					if ( result['undetected_urls'].length > 0 ) {
						template += `VirusTotal Report: https://www.virustotal.com/en/url/${result['undetected_urls'][0][1]}/analysis/`;
					}
				}
				template += `\n\n`;
				template += `[${hostname}] Added to blacklist.`;
	
				print( template );
				alert( template );
	
				sendBackgroundEvent( {
					type : "blacklist",
					item : hostname
				} )
				blacklist.push( hostname );
	
				return sendClientEvent( false );
			}
		}
	
		let xhr = new XMLHttpRequest();
		xhr.open( "GET", `https://www.virustotal.com/vtapi/v2/domain/report?domain=${hostname}&apikey=e6a43307e1a76e9b2c7777443d242b0cc76c31353b1a04096c003e391f4c6b3a`, true );
		xhr.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
		xhr.onreadystatechange = parseResponse;
		xhr.send();
	});
	
	// run the current website against VT before we bother checking the contents
	if ( window.location.hostname !== "" ) {
		let event = new CustomEvent( "queryVirusTotal", { detail : {	"host" : window.location.hostname }	} );
		dispatchEvent( event );
	}

	/*
	 * temporarily disable extracting all js until we decide a good way to run it against VT
	 * :)
	window.addEventListener('message', function(event){
		sendBackgroundEvent(event.detail);
	});*/
	/**
	 * commented out
	 * until we decide on how to detect if a script is malicious
		let externalScripts = [];
		let inlineScripts = [];
	
		for ( let i = 0; i < ( document.scripts.length - 1 ); i++ ) {
			if ( document.scripts[i].getAttribute("src") !== null ) {
				externalScripts.push(document.scripts[i].getAttribute("src") );
			} else {
				inlineScripts.push(document.scripts[i].innerText);
			}
		}
	
		print("External Scripts");
		print("---------------");
		for ( script of externalScripts ) {
			print(script);
		}
		print("---------------");
		print("Inline Scripts");
		print("---------------");
		for ( script of inlineScripts ) {
			print(script);
			print("---------------");
		}
	*/
	
	// We'll be overwriting these methods before a website loads
	// This will allow us to sort of intercept their calls, and decide if we want
	// to allow them
	function init(){
		var DefaultWebSocket 	= WebSocket;
		var DefaultXhrOpen 		= XMLHttpRequest.prototype.open;
		var ready 				= false;
	
		// get hostname without the bullshit
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
	
		function pause ( seconds ) {
			return new Promise( ( resolve ) => setInterval(resolve, seconds) );
		}
	
		async function checkVirusTotal ( host ) {
			// check virus total to see if this request is okay
			let event = new CustomEvent( "queryVirusTotal", { detail : { "host" : host }	} );
			dispatchEvent( event );
	
			// block and wait for ready === true
			while ( ready !== true ) await pause(1000);
			return new Promise( resolve => {
				setTimeout(() => {
					resolve(true);
				}, 2000);
			} );
		}
		
		// listen for approval for specific protocol
		window.addEventListener( "allowProtocol", function ( event ) {
			// set ready to true|false
			ready = event.detail.data;
		} );	
	
		// intercept websockets
		WebSocket = function ( ...params ) {
			let host = getHost( params[0] );
	
			// blocking while checking virus total
			let proceed = checkVirusTotal( host );
			if ( proceed ) {
				// request allowed
				// return original websocket object
				return new DefaultWebSocket( ...params );
			}
	
			// request blocked
			// reset ready and return false
			ready = false;
			return false;	
		};
	
		// intercept xhr
		XMLHttpRequest.prototype.open = function ( ...params ) {
			let host = getHost( params[0] );

			// Ignore GET requests
			if ( params[0] === "GET" ) {
				return DefaultXhrOpen.apply( this, params );
			}
	
			// blocking while checking virus total
			let proceed = checkVirusTotal( host );
			if ( proceed ) {
				// request allowed
				// return original XHR Object
				return DefaultXhrOpen.apply( this, params );
			}
			
			// request blocked
			// reset ready and return false
			ready = false;
			return false;
		};
	}
	
	//dump these overloads into the code.
	let script 	= document.createElement( "script" );
	let code 	= document.createTextNode( `(${init})();` );
	script.appendChild( code );
	(document.body || document.head || document.documentElement).appendChild( script );
}

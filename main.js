/*
 * Chrome Lawbringer
 * 
 * @author dostoevskylabs
 */
console.log("Chrome Lawbringer extension loaded.");
let debug = true;
// connect to our background script to listen for messages
let instance = chrome.runtime.connect( { name : "lawbringer" } );

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
	let event = new CustomEvent( "allowProtocol", { detail : { data : data } } );
	window.dispatchEvent( event );
}

// listen for messages from our background script
instance.onMessage.addListener( function( data ) {
	// handle response type
	switch ( data.type ) {
		// init procedure
		case "init":
			loaded(data.whitelist);
		break;

		case "message":
			sendClientEvent(data.message);
		break;

		default:
			print("Unhandled Response Type.");
	}
});

// defer until background responds with our init case
function loaded (array) {
	window.addEventListener( 'queryVirusTotal', function ( event ) {
		let hostname = event.detail.host;
		sendBackgroundEvent({
			type:"queryVirusTotal",
			item:hostname
		});
	});
	
	// run the current website against VT before we bother checking the contents
	if ( window.location.hostname !== "" ) {
		let event = new CustomEvent( "queryVirusTotal", { detail : { "host" : window.location.hostname } } );
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
	function init( ...array ){
		var whitelist			= [...array]
		var DefaultWebSocket 	= WebSocket;
		var DefaultXhrOpen 		= XMLHttpRequest.prototype.open;
		var ready 				= false;
		var result              = undefined;

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
			let event = new CustomEvent( "queryVirusTotal", { detail : { "host" : host } } );
			dispatchEvent( event );

			// block and wait for ready === true
			while ( ready !== true ) await pause(1000);
			return new Promise( (resolve) => resolve(result) );
		}
		
		// listen for approval for specific protocol
		window.addEventListener( "allowProtocol", function ( event ) {
			// set ready to true|false
			ready = true;
			result = event.detail.data;
		} );	
	
		// intercept websockets
		WebSocket = function ( ...params ) {
			let host = getHost(params[0]);
		
			if ( whitelist.includes(host) ) {
				return new DefaultWebSocket( ...params );
			}

			let status = checkVirusTotal( host );

			status.then(function(proceed){
				// request allowed
				// return original websocket object
				ready = false;
				result = undefined;
				if ( proceed === true ) {
					window.location.reload();
				}
			});
		};
	
		// intercept xhr
		XMLHttpRequest.prototype.open = function ( ...params ) {
			let host = getHost(params[1]);

			// Ignore GET requests
			if ( params[0] === "GET" || whitelist.includes( host ) ) {
				return DefaultXhrOpen.apply( this, params );
			}

			let status = checkVirusTotal( host );

			status.then(function(proceed){
				// request allowed
				// return original XHR object
				ready = false;
				result = undefined;
				if ( proceed === true ) {
					window.location.reload();
				}
			});
		};
	}
	
	//dump these overloads into the code.
	let script 	= document.createElement( "script" );
	let code 	= document.createTextNode( `(${init})('${array.join("','")}');` );
	script.appendChild( code );
	(document.body || document.head || document.documentElement).appendChild( script );
}

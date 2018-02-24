/*
 * Chrome Lawbringer
 * 
 * @author dostoevskylabs
 */

// save our channel
let instance = undefined;
let whitelist = [];
let blacklist = [];

// listen for connections
chrome.runtime.onConnect.addListener( function ( port ) {
	console.assert ( port.name == "lawbringer" );
	instance = port;
	instance.postMessage( {
		type		: "init",
		whitelist 	: whitelist,
		blacklist 	: blacklist
	} );	
	port.onMessage.addListener( function ( request, sender ) {
		// handle request type
		switch ( request.data.type ) {
			case "whitelist":
				if ( !whitelist.includes( request.data.item ) ) whitelist.push( request.data.item );
			break;

			case "blacklist":
				if ( !blacklist.includes( request.data.item ) ) blacklist.push( request.data.item );
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

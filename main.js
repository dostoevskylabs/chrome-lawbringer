/*
 * Chrome Lawbringer - Content Script
 * @author dostoevskylabs
 *
 * eventually I intended to take the scripts and run them against
 * a service that determines if they are malicious
 * and if so terminates that script and blocks it from running
 */
console.log("Chrome Lawbringer extension loaded.");
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

	console.log("External Scripts");
	console.log("---------------");
	for ( script of externalScripts ) {
		console.log(script);
	}
	console.log("---------------");
	console.log("Inline Scripts");
	console.log("---------------");
	for ( script of inlineScripts ) {
		console.log(script);
		console.log("---------------");
	}
*/
// We'll be overwriting these methods before a website loads
// This will allow us to sort of intercept their calls, and decide if we want 
// to allow them. The interesting part about this approach
// as opposed to scanning the entire script is that this will discover attempts
// to connect to a C&C even though the code is heavily obfuscated
// obviously a long way to go.
function init(){
	// intercept websockets
	let previousObject = WebSocket;
	WebSocket = function(...params){
		console.log(`[${window.location.hostname}] requestPermission:webSocket to '${params[0]}'`);
		let answer = prompt(`Allow? [y/n] - Website is attempting to establish a WebSocket on '${params[0]}'`);
		if ( answer === "y" ) {
			// TODO: Actually grant saved permissions.
			console.log(`[${window.location.hostname}] grantPermission:webSocket to '${params[0]}'`);
			return new previousObject(...params);
		} else {
			// TODO: Actually save denied permission, perhaps present user with some information
			console.log(`[${window.location.hostname}] revokePermission:webSocket to '${params[0]}'`);
		}
	};

	// intercept xhr
	let previousPrototype = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function(...params){
		console.log(`[${window.location.hostname}] requestPermission:${params[0]} to '${params[1]}'`);
		let answer = prompt(`Allow? [y/n] - Website is attempting to make a '${params[0]}' request to '${params[1]}'`);
		if ( answer === "y" ) {
			// TODO: Actually grant saved permissions.
			console.log(`[${window.location.hostname}] grantPermission:${params[0]} to '${params[1]}'`);
			return previousPrototype.apply(this, params);
		} else {
			// TODO: Actually save denied permission, perhaps present user with some information
			console.log(`[${window.location.hostname}] revokePermission:${params[0]} to '${params[1]}'`);			
		}
	};
}

// dump these overloads into the code.
let script = document.createElement("script");
let code = document.createTextNode(`(${init})();`);
script.appendChild(code);
(document.body || document.head || document.documentElement).appendChild(script);

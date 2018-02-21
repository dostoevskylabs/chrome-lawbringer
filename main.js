/*
 * eventually I intended to take the scripts and run them against
 * a service that determines if they are malicious
 * and if so terminates that script and blocks it from running
 */

console.log("Chrome Lawbringer extension loaded.");
// An array to store links to external js
// and another to store the contents of inline scripts
let externalScripts = [];
let inlineScripts = [];

// loop through all scripts in the html and store them in their appropriate arrays
for ( let i = 0; i < ( document.scripts.length - 1 ); i++ ) {
	if ( document.scripts[i].getAttribute("src") !== null ) {
		externalScripts.push(document.scripts[i].getAttribute("src") );
	} else {
		inlineScripts.push(document.scripts[i].innerText);
	}
}

// print out the external scripts
console.log("External Scripts");
console.log("---------------");
for ( script of externalScripts ) {
	console.log(script);
}
console.log("---------------");

// print out the inline scripts
console.log("Inline Scripts");
console.log("---------------");
for ( script of inlineScripts ) {
	console.log(script);
	console.log("---------------");
}

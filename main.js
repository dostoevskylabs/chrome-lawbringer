console.log("Chrome Lawbringer extension loaded.");
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

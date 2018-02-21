chrome.processes.onUpdated.addListener(function(processes) {
	for ( tabId in processes ) {
		switch ( processes[tabId].id ) {
			case 0:
			case 2:
			case 42:
			break;			
			default:
				if ( processes[tabId].cpu > 200.0 ) {
					let template =  `
					Terminated '${tabId}' due to exceeded resource usage.
					Title: ${processes[tabId].tasks[0].title}
					CPU: ${processes[tabId].cpu}
					`;
					chrome.processes.terminate(processes[tabId].id, function( didTerminate ) {
						if ( didTerminate ) {
							console.log(template);
						}
					});
				}
		}
	}
});

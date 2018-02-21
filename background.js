chrome.processes.onUpdated.addListener(function(processes) {
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
					
					// terminate the process
					// and log the data stored in the template above
					chrome.processes.terminate(processes[tabId].id, function( didTerminate ) {
						if ( didTerminate ) {
							console.log(template);
						}
					});
				}
		}
	}
});

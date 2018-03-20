'use strict';
class ModulePassport {
constructor(section) {
	var section = document.getElementById(section);
	this.iframe = section.getElementsByTagName('iframe')[0];

	var wl = window.location;
	this.redir = wl.protocol+'//'+wl.host+'/auth/';
	
	this.open();	
}
open() {
	//console.log(this.redir);
	var apiurl = 'https://api.peers.tv/auth/2/authorize/?response_type=code';
	apiurl += '&client_id=demoapp';
	apiurl += '&redirect_uri='+encodeURIComponent(this.redir);
	this.iframe.setAttribute('src',apiurl);

	//this.iframe.setAttribute('src',this.redir+'?code=2e2a2862a68caf4fb7e819d412cefe76');
}
onmessage(event) {
	var win = event.source,
		res = win.location.search.match(/code=([^&]+)/),
		code = !res ? null : res[1];
	//console.log('message', code, event);
	window.whereami.authorize(code, this.redir);
}
};
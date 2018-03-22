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
	var account = $App.account();
	if(!account) console.log('passport',this.redir);
	else return console.log('passport',account.username);

	var apiurl = 'https://api.peers.tv/auth/2/authorize/?response_type=code';
	apiurl += '&client_id=demoapp';
	apiurl += '&redirect_uri='+encodeURIComponent(this.redir);
	this.iframe.setAttribute('src', apiurl);

	var code_response = function(){
		var code = '4ba7236fa8149876b4d3bcb624cf02a5';
		this.iframe.setAttribute('src',this.redir+'?code='+code);
	}.bind(this);
	//setTimeout(code_response,1000);
}
onmessage(event) {
	var win = event.source,
		res = win.location.search.match(/code=([^&]+)/),
		code = !res ? null : res[1];
	console.log('message', code, event);
	window.whereami.authorize(code, this.redir);
}
};
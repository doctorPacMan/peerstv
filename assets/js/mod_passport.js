'use strict';
class ModulePassport {
constructor(section) {
	var section = document.getElementById(section),
		iframe = section.getElementsByTagName('iframe')[0];

	iframe.setAttribute('src','about:blank');
	iframe.setAttribute('allowtransparency','');
	iframe.setAttribute('allowfullscreen','');
	iframe.setAttribute('frameborder','0');
	iframe.setAttribute('height','100%');
	iframe.setAttribute('width','100%');
	iframe.setAttribute('seamless','');
	iframe.setAttribute('name','mod-passport-iframe');
	iframe.setAttribute('id',iframe.getAttribute('name'));
	iframe.addEventListener('load',this._onload.bind(this));
	this.iframe = iframe;

	// redirect_uri
	var wl = window.location;
	this.reurl = wl.protocol+'//';
	this.reurl+= wl.host+'/auth/';
	
	this.open();
}
_onload(e) {
	var iframe = e.target,
		win = iframe.contentWindow,
		doc, loc;

	try{doc = iframe.contentDocument || win.document}
	catch(e){'document blocked'};
	loc = doc ? doc.location.href : null;
	//console.log('onload', e.target.src);
	console.log('onload '+(loc?'loc':'src'),(loc || iframe.src));
}
open() {
	var account = $App.account();
	if(!account) console.log('passport',this.reurl);
	else return console.log('passport',account.username);

	//return this.iframe.setAttribute('src','https://ya.ru');


	var apiurl = $App.api.service('auth').location;
	apiurl += 'authorize/?response_type=code';
	apiurl += '&client_id=demoapp';
	apiurl += '&redirect_uri='+encodeURIComponent(this.reurl);
	this.iframe.setAttribute('src', apiurl);
	//return this.iframe.setAttribute('src',this.reurl);
	
	var code_response = function(){
		var code = '4ba7236fa8149876b4d3bcb624cf02a5';
		this.iframe.setAttribute('src',this.reurl+'?code='+code);
	}.bind(this);
	//setTimeout(code_response,1000);
}
onmessage(event) {
	var win = event.source,
		res = win.location.search.match(/code=([^&]+)/),
		code = !res ? null : res[1];
	console.log('message', code, event);
	window.whereami.authorize(code, this.reurl);
}
};
'use strict';
class ModulePassport {
constructor(section) {
	var section = document.getElementById(section),
		iframe = section.getElementsByTagName('iframe')[0];

	this._timer = new uiTimer(section.querySelector('h2 > time'));

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
	this.iframe.classList.add('hddn');

	// redirect_uri
	var wl = window.location;
	this._redirect = wl.protocol+'//';
	this._redirect+= wl.host+'/auth/';
	iframe.setAttribute('src',this._redirect);

	//this.open();
}
_onload(e) {
	var iframe = e.target,
		win = iframe.contentWindow,
		doc, loc;

	try{doc = iframe.contentDocument || win.document}
	catch(e){'document blocked'};
	loc = doc ? doc.location.href : null;
	//console.log('onload '+(loc?'loc':'src'),(loc || iframe.src));
}
open() {
	var account = $App.account();
	if(account.name) this.iframe.setAttribute('src',this._redirect)
	else {
		var apiurl = $App.api.service('auth').location;
		apiurl += 'authorize/?response_type=code';
		apiurl += '&client_id=demoapp';
		apiurl += '&redirect_uri='+encodeURIComponent(this._redirect);
		this.iframe.setAttribute('src', apiurl);
	}
	//return this.iframe.setAttribute('src',this._redirect);
	var code_response = function(){
		var code = '4ba7236fa8149876b4d3bcb624cf02a5';
		this.iframe.setAttribute('src',this._redirect+'?code='+code);
	}.bind(this);
	//setTimeout(code_response,1000);
}
onmessage(event) {
	var win = event.source,
		res = win.location.search.match(/code=([^&]+)/),
		code = !res ? null : res[1];
	console.log('message', code, event);
	window.whereami.authorize(code, this._redirect);
}
update() {
	//var account = $App.account();
	var expires = (Date.current()).getTime() + 300*1000,
		account = {
		id:84894,expires:expires,
		login:"doctorpacman@ya.ru",
		refresh:"f6d5508d-202f-05e3-933e-11c61eef7a24",
		token:"8127d791502ae237d7c5ae977f267585"
	};
	var exp = new Date(account.expires) - Date.current();
	//console.log('UPD', Math.floor(exp/1000), account);
	this._timer.start(Math.floor(exp/1000))
}
};
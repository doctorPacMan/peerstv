'use strict';
class ModulePassport extends AppModule {
_constructor(){

	var section = this.section;
	
	var iframe = section.getElementsByTagName('iframe')[0];
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
	window.addEventListener('message',this.onmessage.bind(this));

	// redirect_uri
	// ms-appx-web:///auth/index.html
	var wl = window.location;
	this._redirect = wl.protocol+'//';
	this._redirect+= wl.host+'/auth/';

	iframe.style.display = null;
	this.iframe.classList.add('hddn');
	this.iframe.setAttribute('src',this._redirect);
	//this.iframe.setAttribute('src','about:blank');

	this._N = {
		login: section.querySelector('h2 > button')
	};
	this._N.login.addEventListener('click',this.toggleAuth.bind(this));

	var node = section.querySelector('#acc-territory');
	this._N.territory = {
		time: node.querySelector('time'),
		name: node.querySelector('u'),
		zone: node.querySelector('s')
	}
	
	var node = section.querySelector('#acc-provider');
	this._N.provider = {
		logo: node.querySelector('img'),
		name: node.querySelector('sub')
	}
	var node = section.querySelector('#acc-account');
	this._N.account = {
		timer: new uiTimer(node.querySelector('time')),
		token: node.querySelector('span'),
		login: node.querySelector('u'),
		accid: node.querySelector('s')
	};
	//this.update();
	//this.open();

	var node = section.querySelector('#device-info');
	this._N.device = {
		uagent: node.querySelector('p:nth-child(1) span'),
		screen: node.querySelector('p:nth-child(2) span')
	};
	this.updateDeviceInfo();
}
updateDeviceInfo() {
	var r = window.devicePixelRatio,
		sw = window.screen.width,
		sh = window.screen.height,
		//ah = window.screen.availHeight,
		//aw = window.screen.availWidth,
		dw = document.body.offsetWidth,
		dh = document.body.offsetHeight;
	this._N.device.screen.innerText = sw+'x'+sh+'('+r+') '+dw+'x'+dh;

	var ua = window.navigator.userAgent
	this._N.device.uagent.innerText = ua;
	//console.log(sw+'x'+sh+' ('+r+')');
}
toggleAuth(e) {

	var apiurl = $App.api.service('auth').location;
		apiurl += 'authorize/?response_type=code';
		apiurl += '&client_id=demoapp';
		apiurl += '&redirect_uri='+encodeURIComponent(this._redirect);
	this.iframe.setAttribute('src',apiurl);

	var hddn = this.iframe.classList.contains('hddn');
	this.iframe.classList[hddn?'remove':'add']('hddn');
	this.iframe.style.display = hddn?null:'none';
}
_onload(e) {
	var iframe = e.target,
		win = iframe.contentWindow,
		doc, loc;

	//try{doc = iframe.contentDocument || win.document}
	//catch(e){'document blocked'};
	//loc = doc ? doc.location.href : null;
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
	$App.api.authorize(code, this._redirect);
	this.iframe.classList.add('hddn');
}
updateProvider(data) {
	//console.log('updateProvider',data);
	var logo = data.images.find(v=>{return v.profile===1});
	this._N.provider.logo.setAttribute('src',logo?logo.URL:'');

	var name = data.name || 'unknown';
	if(data.brandName) name = '\u00AB'+data.brandName+'\u00BB';
	this._N.provider.name.innerText =  name;
}
updateTerritory(data) {
	//console.log('updateTerritory',data);
	this._N.territory.name.title = 'id: '+data.territoryId;
	this._N.territory.name.innerText = data.name;

	var tz = (data.timezone/3600 - 3);
	this._N.territory.zone.innerText = 'MSK'+(tz<0?tz:'+'+tz);
	
	var timenode = this._N.territory.time,
		timetick = function(){timenode.innerText = Date.current().format('h:nn:ss')}.bind(this);
	if (this._time_interval) clearInterval(this._time_interval);
	this._time_interval = setInterval(timetick,1000);timetick();
	//this._N.territory.time = 
}
updateAccount(data) {
	console.log('updateAccount',data);
	//if(!data) return;
	this._N.account.accid.innerText = data.account_id;
	this._N.account.login.innerText = data.username || 'anonymous';
	this._N.account.token.innerText = data.token || 'undefined';
	
	if(data.expires) {
		var exp = new Date(data.expires);//console.log(exp);
		this._N.account.timer.start(Math.floor((exp - Date.current())/1e3));
	} else this._N.account.timer.stop();
}
update() {
//this.updateTerritory({"territoryId":16,"name":"Новосибирск","parentId":4,"isLeaf":false,"timezone":25200});
//this.updateProvider({"contractorId":1,"name":"Новотелеком, ООО","images":[{"width":150,"height":90,"URL":"http://a.trunk.ptv.bender.inetra.ru/data/registry/images/2842.png","profile":2},{"width":150,"height":90,"URL":"http://a.trunk.ptv.bender.inetra.ru/data/registry/images/2712.png","profile":3},{"width":180,"height":180,"URL":"http://a.trunk.ptv.bender.inetra.ru/data/registry/images/2101.png","profile":1}],"brandName":"Электронный город","privateOfficeURL":"https://billing.novotelecom.ru/billing/user/stb310","callCenterNumber":"+7 (383) 209-00-00","supportedOfficeIdioms":[1,2]});
	this.updateTerritory($App.api.territory());
	this.updateProvider($App.api.contractor());
	//$App.request.account().then(this.updateAccount.bind(this));
}
};
"use strict";
var Whereami = function() {return this.initialize.apply(this,arguments)};
Whereami.prototype = {
INETRA_CID: 2,
API_VERSION: 2,
API_CLIENT: 'demoapp',
API_SECRET: 'demoapp',
API_HOST: 'http://api.peers.tv',
initialize: function(url) {
	this._url = this.API_HOST+'/registry/2/whereami.json';
	//this._url = '/data/whereami.json';
	this._cbacks = [];
	this._data = null;
	this._this = null;

	var wrmi = localStorage.getItem('app.whereami');//wrmi = false;
	if(wrmi) this._onloadRegistry(JSON.parse(wrmi));
	else XHR.whereami(this._url, this._onloadRegistry.bind(this));
	return this.thiz();
},
_onloadRegistry: function(data, xhr) {
	this._data = {
		_contractors:{},
		_territories:{},
		contractor: {},
		territories:[],
		services:[]
	};
	this._contractors = {};
	this._territories = {};
	this.contractorId;
	this.territoryId;

	if(false===data) console.error('loading failure');
	else this._data = Object.assign(this._data, data);
	
	if(data.contractor) {
		var cn = Object.assign({},data.contractor);
		this._contractors[cn.contractorId] = cn;
		this.contractorId = cn.contractorId;
	}

	var cids = [], iptv = data.services.filter(s=>{return s.type == 'iptv'});
	iptv.forEach(s=>{var cid = s.contractor.contractorId;
		if(cid !== this.contractorId) cids.push(cid);
	}); cids.push(1549,12,3); //this._requestContractors(cids);

	if(data.territories) {
		data.territories.forEach(t=>{
			this._territories[t.territoryId] = Object.assign({},t);
		});
		this.territoryId = data.territories[0].territoryId;
	}

	this.iptv();

	localStorage.setItem('app.whereami', JSON.stringify(data));
	this.timeoffset(!xhr?false:xhr.getResponseHeader('Date'));

	if(!this.token()) this._requestToken();
	else this._complete();
},
thiz: function() {
	var thiz = new Object;
	Object.defineProperty(thiz, 'host', {configurable: false,
		enumerable: true, writable: false,
		value: this.API_HOST.toString()
	});
	Object.defineProperty(thiz, 'url', {configurable: false,
		enumerable: false, writable: false,
		value: this._url.toString()
	});
	Object.defineProperty(thiz, 'timeoffset', {configurable: false,
		enumerable: true, writable: false,
		value: this.timeoffset.bind(this,false)
	});
	Object.defineProperty(thiz, 'territory', {configurable: false,
		enumerable: true, writable: false,
		value: this.territory.bind(this)
	});
	Object.defineProperty(thiz, 'contractor', {configurable: false,
		enumerable: true, writable: false,
		value: this.contractor.bind(this)
	});
	Object.defineProperty(thiz, 'service', {configurable: false,
		enumerable: true, writable: false,
		value: this.service.bind(this)
	});
	Object.defineProperty(thiz, 'onready', {configurable: false,
		enumerable: false,
		value: this.onready.bind(this)
	});
	Object.defineProperty(thiz, 'authorize', {configurable: false,
		enumerable: true,
		value: this.authorize.bind(this)
	});
	Object.defineProperty(thiz, 'token', {configurable: false,
		enumerable: true,
		value: this.token.bind(this)
	});
	Object.defineProperty(thiz, 'setAuthToken', {configurable: false,
		enumerable: true,
		value: this.setAuthToken.bind(this)
	});
	Object.defineProperty(thiz, 'iptv', {configurable: false,
		enumerable: true,
		value: this.iptv.bind(this)
	});
	Object.defineProperty(thiz, 'data', {configurable: false,
		enumerable: true,
		get: this.data.bind(this)
	});
	return this._this = thiz;
},
onready: function(callback) {
	if(this._data===null) this._cbacks.push(callback);
	else callback();
	return this._this;
},
timeoffset: function(time) {
	if(!time) return (this._timeoffset || 0);
	var wdt = new Date(time),
		now = new Date(),
		offset = wdt.getTime() - now.getTime();
	//console.log('timeoffset', offset, wdt, now);
	return this._timeoffset = offset;
},
setAuthToken: function(token) {
	var tknew = token,
		tkold = this.token();
	if(tknew !== tkold) {
		let tkexp = new Date();
		tkexp.setMilliseconds(15*60*1e3);
		cookie.set('token.current', tknew, tkexp);
		console.log('setAuthToken', tknew);
		XHR.token = tknew;
		this.account();
	}
},
authorize: function(code, ruri) {
	console.log('AUTH', code, ruri);

	var auth = this.service('auth'),
		url = auth.location+'token/',
		params = {
			'grant_type':'authorization_code',
			'client_secret':this.API_SECRET,
			'client_id':this.API_CLIENT,
			//'redirect_uri':encodeURIComponent(this.redir),
			'redirect_uri':ruri,
			'code':code
		};
	params = Object.keys(params).map(p=>{return p+'='+params[p]});
	XHR.load(url, this._onAuthorize.bind(this), params.join('&'));
},
_onAuthorize: function(data) {
	console.log('AUTH', data);

var xhr = new XMLHttpRequest(),
//token = 'cfcf68e09dff4cd2b36eace69d1da73a';
token = data.access_token;
xhr.open('GET', 'http://api.peers.tv/auth/2/account/', true);
xhr.setRequestHeader('Authorization','Bearer '+token);
xhr.onreadystatechange = function () {
	if(xhr.readyState != 4) return;
	if(xhr.status != 200) console.log(false, xhr.status);
	else {
	    var text = xhr.responseText, json;
	    if(/^(?:\{|\[|\")/.test(text))
		    try {json = JSON.parse(xhr.responseText)}
		    catch(e) {console.log('Error',e,text)};
		console.log(json || text, xhr);
	}
};
xhr.send(null);

},
account: function() {
	var auth = this.service('auth'),
		apiurl = auth.location+'account/';
/*
var xhr = new XMLHttpRequest(),
token = 'cfcf68e09dff4cd2b36eace69d1da73a';
xhr.open('GET', 'http://api.peers.tv/auth/2/account/', true);
xhr.setRequestHeader('Authorization','Bearer '+token);
xhr.onreadystatechange = function () {
	if(xhr.readyState != 4) return;
	if(xhr.status != 200) console.log(false, xhr.status);
	else {
	    var text = xhr.responseText, json;
	    if(/^(?:\{|\[|\")/.test(text))
		    try {json = JSON.parse(xhr.responseText)}
		    catch(e) {console.log('Error',e,text)};
		console.log(json || text, xhr);
	}
};
xhr.send(null);
*/
	XHR.account(apiurl, function(data,xhr){console.log('Account:',data,xhr.status)});
},
token: function(token) {
	//return '8e53532d80ca016d436bc0b0a48bd1da';
	if(token) {};
	return cookie.get('token.current');
},
_setDatetime: function(headerDate) {
	if(headerDate) console.log('DATE', new Date(headerDate));
},
_requestContractors: function(cids) {
	var url = this.API_HOST+'/registry/'+this.API_VERSION+'/contractors.json?id=';
	url += cids.join(',');
	XHR.load(url,function(data){
		data.contractors.forEach(c=>{this._contractors[c.contractorId] = c});
		//console.log('CIDS',this._contractors);
	}.bind(this));
},
_requestToken: function() {

	var current = cookie.get('token.current'),
		refresh = cookie.get('token.refresh');

	if(current) return this._complete();

	var auth = this.service('auth'),
		url = auth.location+'token/',
		params = {
			'grant_type': 'inetra:anonymous',
			'client_secret':this.API_SECRET,
			'client_id':this.API_CLIENT
		};

	params = Object.keys(params).map(p=>{return p+'='+params[p]});
	XHR.load(url, this._onloadToken.bind(this), params.join('&'));
},
_onloadToken: function(data) {

	var token = data.access_token,
		expires = new Date();

	//console.log('auth data', data);
	expires.setMilliseconds(1e3*data.expires_in);
	cookie.set('token.current', data.access_token, expires);

	expires.setHours(expires.getHours() + 24*7);
	cookie.set('token.refresh', data.refresh_token, expires);
	
	this._complete();
},
_complete: function() {
	this._cbacks.forEach((cb) => {cb()});
	delete this._cbacks;
},
territory: function(tid) {
	var tid = parseInt(tid,10),
		tid = !isNaN(tid) ? tid : this.territoryId;
	return this._territories[tid];
},
contractor: function(cid) {
	var cid = parseInt(cid,10),
		cid = !isNaN(cid) ? cid : this.contractorId;
	return this._contractors[cid];
},
iptv: function() {
	var list = [],
		svitems = this._data.services.filter(s=>{return s.type == 'iptv'});
	svitems.forEach(function(s){
		var cid = s.contractor.contractorId,
			apv = s.apiVersions.length ? s.apiVersions[s.apiVersions.length-1] : null,
			src = null===apv ? undefined : apv.location;
		list.push({cid:cid, src:src});
	});
	return list;
},
service: function(type) {

	var servapi,
		usercid = this.contractorId,
		svitems = this._data.services.filter(s=>{return s.type == type}),
		service = svitems.find(s=>{return s.contractor.contractorId == usercid});
	service = service || svitems.find(s=>{return s.contractor.contractorId == this.INETRA_CID});
	service = service || svitems[0];
	
	if(!service) console.warn('Undefined service "'+type+'"');
	else {
		var apv = service.apiVersions,
			cur = apv.find(s=>{return s.majorVersion == this.API_VERSION});
		servapi = (cur || apv[apv.length - 1]);
	}
	//console.log('services/'+type, servapi);
	return servapi;
},
data: function(value) {return this._data}
};
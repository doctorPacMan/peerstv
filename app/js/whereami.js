"use strict";
var Whereami = function() {return this.initialize.apply(this,arguments)};
Whereami.prototype = {
INETRA_CID: 2,
API_VERSION: 2,
API_HOST: 'api.peers.tv',
//API_HOST: 'a.trunk.ptv.bender.inetra.ru',
initialize: function(url) {
	this._url = '//'+this.API_HOST+'/registry/2/whereami.json';
	//this._url = '/data/whereami.json';
	this._cbacks = [];
	this._data = null;
	this._this = null;
	return this.thiz();
	//return this._load();
},
init: function(callback) {
	var wrmi = localStorage.getItem('app.whereami');//wrmi = false;
	if(wrmi) this._onloadRegistry(JSON.parse(wrmi));
	else XHR.whereami(this._url, this._onloadRegistry.bind(this));
	return this.onready(callback);
},
onready: function(callback) {
	if(this._data===null) this._cbacks.push(callback);
	else callback();
	return this._this;
},
_onloadRegistry: function(data, xhr) {
	//console.log('whereami '+(xhr?'request':'restore'), data);
	this._data = {
		_contractors:{},
		_territories:{},
		_timeoffset: 0,
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

	var wrmdate = !xhr ? null : xhr.getResponseHeader('Date');
	data.timeoffset = this.timeoffset(wrmdate);
	Date.prototype.timeoffset = data.timeoffset;
	//console.log('set Date.current()', Date.current());
	//console.log('Date.current() offset: '+Date.prototype.timeoffset +'\nlocal: '+ new Date() +'\nfixed: '+ Date.current());

	localStorage.setItem('app.whereami',JSON.stringify(data));

	//this._complete();
	return this._authorize();
},
timeoffset: function(wrmdate) {
	var offset = (this._data.timeoffset || 0),
		apitime, territory, tzoffset = 0;
	
	if(wrmdate === null) return offset;
	else apitime = new Date(wrmdate);

	offset = apitime.getTime() - Date.now();
	if(territory = this.territory()) {
		let localtz = -60 * (new Date).getTimezoneOffset();
		tzoffset = localtz - territory.timezone;
	}
	return offset - (tzoffset*1e3);
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
	Object.defineProperty(thiz, 'territory', {configurable: false,
		enumerable: true, writable: false,
		value: this.territory.bind(this)
	});
	Object.defineProperty(thiz, 'contractor', {configurable: false,
		enumerable: true, writable: false,
		value: this.contractor.bind(this)
	});
	Object.defineProperty(thiz, 'medialocator', {configurable: false,
		enumerable: true, writable: false,
		value: this.medialocator.bind(this)
	});
	Object.defineProperty(thiz, 'service', {configurable: false,
		enumerable: true, writable: false,
		value: this.service.bind(this)
	});
	Object.defineProperty(thiz, 'init', {configurable: false,
		enumerable: false,
		value: this.init.bind(this)
	});
	Object.defineProperty(thiz, 'onready', {configurable: false,
		enumerable: false,
		value: this.onready.bind(this)
	});
	Object.defineProperty(thiz, 'authorize', {configurable: false,
		enumerable: true,
		value: this.authorize.bind(this)
	});
	Object.defineProperty(thiz, 'get_account', {configurable: false,
		enumerable: true,
		value: this.getAccount.bind(this)
	});
	Object.defineProperty(thiz, 'account', {configurable: false,
		enumerable: true,
		value: this.account.bind(this)
	});
	Object.defineProperty(thiz, 'getAuthToken', {configurable: false,
		enumerable: true,
		value: this.getAuthToken.bind(this)
	});
	Object.defineProperty(thiz, 'token', {configurable: false,
		enumerable: true,
		value: this.token.bind(this)
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
_setDatetime: function(headerDate) {
	if(headerDate) console.log('DATE', new Date(headerDate));
},
_requestContractors: function(cids) {
	var url = '//'+this.API_HOST+'/registry/'+this.API_VERSION+'/contractors.json?id=';
	url += cids.join(',');
	XHR.load(url,function(data){
		data.contractors.forEach(c=>{this._contractors[c.contractorId] = c});
		//console.log('CIDS',this._contractors);
	}.bind(this));
},
_complete: function() {
	if(this._cbacks) this._cbacks.forEach((cb) => {cb()});
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
medialocator: function(cid) {
	var svitems = {},
		service = this._data.services.filter(s=>{return s.type == 'media_locator'}),
		locator = service.find(s=>{return cid==s.contractor.contractorId});
	return locator.apiVersions[0].location;
	locator.forEach(s=>{
		var cid = s.contractor.contractorId,
			apv = s.apiVersions[0];
		svitems[cid] = apv.location;
	});

	var loc = locator.find(s=>{return cid==s.contractor.contractorId});
	console.log(cid, loc)
	return svitems;
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
	
	//if(servapi && servapi.location)	servapi.location = servapi.location.replace('//api.peers.tv',('//'+this.API_HOST));
	//console.log('services/'+type, servapi);
	return servapi;
},
data: function(value) {return this._data}
};
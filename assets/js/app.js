"use strict";
var $App = {
initialize: function() {
	window.database = new Database('database',1).open();
	window.database.onready(this._onready_database.bind(this));
	window.addEventListener('message',this.onmessage.bind(this));
},
onmessage: function(event) {
	this._passport.onmessage(event);
	//if (~event.origin.indexOf('http://yoursite.com'))
},
_onready_database: function(success, indb) {
	console.log('database',window.database);
	window.whereami = new Whereami();
	window.whereami.onready(this._onready_whereami.bind(this));
},
_onready_whereami:function() {
	console.log('whereami',window.whereami);
	this.api = window.whereami;
	this.setAuthToken();
	this.setAccount();
	return this._passport = new ModulePassport('mod-passport');
	//console.log(window.whereami.contractor());
	//console.log(window.whereami.territory());
	//Date.offset = window.whereami.timeoffset();
	//console.log(XHR.token);

	new playlistLoader(this._onready_playlist.bind(this), function(){});
},
_onready_playlist: function(data) {
	console.log('playlist', data.length);
	this.init(data);
},
drop: function() {
	console.log('DROP');
	var sc = window.database.storage('channels');
	sc.clean(function(success,count){console.log('drop channels', success?'success':'failure', count)});

	localStorage.removeItem('app.whereami');
	console.log('drop whereami',localStorage.getItem('app.whereami')===null ? 'success' : 'failure');

	localStorage.removeItem('app.account');
	localStorage.removeItem('app.retoken');
	cookie.del('token');
	console.log('token',cookie.get('token')===null ? 'success' : 'failure');
},
init: function(channels) {
	//console.log(this.api);
	//console.log(this.api.token());
	//console.log(this.api.contractor());
	//console.log(this.api.territory());
	new ModuleChannels('mod-channels',channels);
},
setAuthToken: function() {
	var token = window.whereami.token();
	if(token) XHR.token = token;
	console.log('setToken:', token);
},
setAccount: function() {
	var account = this.account();
	console.log('Set account:', account);
	if(account) {
		this.request.archive(function(data){console.log('ARH',data)});
		this.request.favourites(function(data){console.log('FVR',data)});
	}
},
account: function() {return this.api.account()},
token: function() {return this.api.token()}
};
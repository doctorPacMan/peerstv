"use strict";
// {id: 84894, name: "doctorpacman@ya.ru", expires: 1521889230000, refresh: "01164a074881b3ef97cea324bbf14e5c", token: "30413de2557f7be16af6699727b470cf"}
var $App = {
initialize: function() {

this._passport = new ModulePassport('mod-passport');
this._passport.update();
return;

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
	window.whereami = this.api = new Whereami();
	window.whereami.onready(this._onready_whereami.bind(this));
},
_onready_whereami:function() {
	console.log('whereami',window.whereami);
//	this.api = window.whereami;
	
	this._passport = new ModulePassport('mod-passport');
	this._passport.update();
	//return this._passport = new ModulePassport('mod-passport');
	//console.log(window.whereami.contractor());
	//console.log(window.whereami.territory());
	//Date.offset = window.whereami.timeoffset();
	//console.log(XHR.token);

	//new playlistLoader(this._onready_playlist.bind(this), function(){});
},
_onready_playlist: function(data) {
	console.log('playlist', data.length);
	this.init(data);
},
drop: function() {
	console.log('DROP');

	cookie.del('token');
	localStorage.removeItem('app.token');
	localStorage.removeItem('app.account');
	console.log('drop authtoken', cookie.get('token'));

	var sc = window.database.storage('channels');
	sc.clean(function(success,count){console.log('drop channels:', success?'success':'failure', count)});

	localStorage.removeItem('app.whereami');
	console.log('drop whereami:', localStorage.getItem('app.whereami')===null ? 'success' : 'failure');
},
init: function(channels) {
	//console.log(this.api);
	//console.log(this.api.token());
	//console.log(this.api.contractor());
	//console.log(this.api.territory());
	new ModuleChannels('mod-channels',channels);
},
setAuthToken: function() {
	var token = this.token();
	console.log('Set token:', token);
	XHR.token = token;
},
setAccount: function() {
/*
	var account = this.account();
	console.log('Set account:', account);
	if(!account.anon && false) {
	}
*/
},
favor: function() {
	this.request.archive(function(data){console.log('ARH',data)});
	this.request.favourites(function(data){console.log('FVR',data)});
},
account: function() {return this.api.account() || {}},
token: function() {return this.api.token()}
};
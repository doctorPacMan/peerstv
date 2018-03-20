"use strict";
var $App = {
initialize: function() {
	//if(window.location.search.indexOf('?auth')>=0) return this.screen('auth');
	window.database = new Database('database',1).open();
	window.database.onready(this._onready_database.bind(this));
	window.addEventListener('message',this.onmessage.bind(this));
},
onmessage: function(event) {
	this._passport.onmessage(event);
	//if (~event.origin.indexOf('http://yoursite.com'))
},
screen: function(name) {
	var stage = document.body.querySelector('div');
	stage.style.display = 'none';
	//console.log();
},
_onready_database: function(success, indb) {
	console.log('database',window.database);
	window.whereami = new Whereami();
	window.whereami.onready(this._onready_whereami.bind(this));
},
_onready_whereami:function() {
	console.log('whereami',window.whereami);
	//console.log(window.whereami.contractor());
	//console.log(window.whereami.territory());
	XHR.token = window.whereami.token();
	Date.offset = window.whereami.timeoffset();
	//console.log(XHR.token);
	return this._passport = new ModulePassport('mod-passport');

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

	cookie.del('token.current');
	cookie.del('token.refresh');
	console.log('token.current',cookie.get('token.current')===null ? 'success' : 'failure');
	console.log('token.refresh',cookie.get('token.refresh')===null ? 'success' : 'failure');

},
init: function(channels) {
	//console.log(this.api);
	//console.log(this.api.token());
	//console.log(this.api.contractor());
	//console.log(this.api.territory());
	new ModuleChannels('mod-channels',channels);
}
};
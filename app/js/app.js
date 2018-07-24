"use strict";
var $App = {
initialize: function() {
	window.UWP = location.protocol=='ms-appx:' ? location.host : false;

	this.emitter = eventEmitter();
	this._tvplayer = new ModuleTvplayer('mod-tvplayer');
	this._telecasts = {};
	//return;

	this.moduleRegister('schedule',new ModuleSchedule('mod-schedule'));
	this.moduleRegister('passport',new ModulePassport('mod-passport'));
	this.moduleRegister('channels',new ModuleChannels('mod-channels'));
	this.moduleRegister('telecast',new ModuleTelecast('mod-telecast'));
	attachEvent('module/toggle',this.onModuleToggle.bind(this));

	window.database = new Database('database',1).open();
	window.database.onready(this._onready_database.bind(this));
	window.addEventListener('resize',this.resize.bind(this,false));
	this.resize();
},
_onready_database: function(success, indb) {
	//console.log('database', window.database);
	this.api = window.whereami = new Whereami();
	this.api.init(this._onready_whereami.bind(this));
},
_onready_whereami:function() {
	//console.log('whereami', this.api);
	//console.log('_account', this.api.account());
	//return;
	dispatchEvent('whereami');
	//this.mod('telecast').module.test();
	//var s = window.database.storage('channels');
	//new playlistLoader(this._onready_playlist.bind(this), function(){});
	new cnapi.request.playlistLoader(this._onready_playlist.bind(this), function(){});
},
_onready_playlist: function(data) {
	//console.log('playlist', data.length);
	//var s = window.database.storage('channels');
	//return console.log('SS',s.fill(data));
	this.channels = data;
	this.mod('passport').module.update();
	this.mod('channels').module.update(data);
	//this.mod('schedule').module.update();
	this.router.initialize();
},
resize: function() {
	//console.log('resize');
},
init: function(channels) {
	//console.log(this.api);
	//console.log(this.api.token());
	//console.log(this.api.contractor());
	//console.log(this.api.territory());
},
drop: function() {
	console.log('DROP');

	cookie.del('token');
	localStorage.removeItem('app.token');
	localStorage.removeItem('app.account');
	console.log('drop authtoken', cookie.get('token'));

	localStorage.removeItem('app.whereami');
	console.log('drop whereami:', localStorage.getItem('app.whereami')===null ? 'success' : 'failure');

	var sc = window.database.storage('channels');
	sc.clean(function(success,count){console.log('drop channels:', success?'success':'failure', count)});
},
setAuthToken: function() {
	var token = this.token();
	console.log('Set token:', token);
	XHR.token = token;
},
getTelecast: function(id) {
	return this._telecasts[id] || null;
},
registerTelecast: function(json, cnid) {
	if(cnid) {
		if(!json.channel) json.channel = {channelId:cnid};
		else if(json.channel.channelId) {console.warn('cnid override')}
		else json.channel.channelId = cnid;
	}
	
	var tvshow = new Tvshow(json);
	this._telecasts[tvshow.id] = tvshow;
	return tvshow;
},
getChannel: function(apid) {
	return this.channels.find(v=>{return apid==v.apid});
},
getChannelById: function(cnid) {
	return this.channels.find(v=>{return cnid==v.channelId});
},
loadChannel: function(apid) {
	var cha = this.channels.find(v=>{return apid==v.apid}),
		source = cha.sources[0];
	//console.log('loadChannel', cha);
	this._tvplayer.load(source.src);
	dispatchEvent('channel/load',{apid:cha.apid});
},
playChannel: function(cnid) {
	var cha = this.getChannelById(cnid);
	console.log(cha)
	dispatchEvent('channel/play',{apid:cha.apid});
},
playTelecast: function(id) {
	//console.log('playTelecast',id);
	dispatchEvent('telecast/play',id);
},
favor: function() {
	this.request.archive(function(data){console.log('ARH',data)});
	this.request.favourites(function(data){console.log('FVR',data)});
},
account: function() {return this.api.account() || {}},
token: function() {return this.api.token()},
mod: function(id) {
	return this._mods[id];
},
moduleRegister: function(mid, mod) {
	if(!this._mods) this._mods = {};
	var aside = document.querySelector('body > div > aside'),
		btn = aside.querySelector('a[data-section="'+mid+'"]');
	mod.apid = mid;
	//console.log('reg', mid, mod);
	//console.log('reg', mid, btn);
	if(btn) {
		btn.onclick = mod.toggle.bind(mod);
		btn.classList[mod.hidden?'remove':'add']('visible');
	}
	this._mods[mid] = {
		module: mod,
		button: btn
	};
},
onModuleToggle:function(e){
	var mid = e.detail;
	var mod = this.mod(mid);
	if(mod.button) mod.button.classList[mod.module.hidden?'remove':'add']('visible');
	//console.log(apid, !mod.module.hidden, mod);
},
toggleModule: function(id) {
	var mod = this.mod(id);
	console.log('toggleModule', id, !mod.module.hidden);
}
};

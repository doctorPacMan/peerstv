'use strict';
class Tvplayer {
constructor(container) {
	this.STATE_IDLE = 'IDLE';
	this.STATE_VOID = 'IDLE';
	this.STATE_LOAD = 'LOAD';
	this.STATE_VIEW = 'VIEW';
	this.STATE_FAIL = 'FAIL';

	this._hls_type = this.hlsPlayType();
	//console.log('Tvplayer', this._hls_type || 'hlsjs');

	var container = document.getElementById(container);
	this.container = container;
	this._stage = document.createElement('div');
	this._video = this.createVideoElement();
	this._stage.appendChild(this._video);
	
	this._title = this.createTitleElement();
	this._stage.appendChild(this._title.el);

	this._controls = this.createPanelElement();
	this._panel = this._controls.panel;
	this._stage.appendChild(this._controls.spinner);
	this._stage.appendChild(this._controls.btnplay);
	this._stage.appendChild(this._controls.wrapper);

	this._stage.setAttribute('class','tvplayer');
	this.container.appendChild(this._stage);
	this.state(this._state = this.STATE_IDLE);
	this.title({logo:'',name:'',time:'',desc:''});
	this.error(false);
	this.pause(true);
	this.mute(true);

	if(1) this._hover('brute',true,true);
	else {
		this._hover_stop = this._hover.bind(this,'timer',false);
		this._stage.addEventListener('mousemove',this._hover.bind(this,'stage',true,false));
		this._stage.addEventListener('mouseover',this._hover.bind(this,'stage',true,false));
		this._stage.addEventListener('mouseleave',this._hover.bind(this,'stage',false,false));
		this._panel.addEventListener('mouseover',this._hover.bind(this,'panel',true,true),true);
		this._panel.addEventListener('mousemove',this._hover.bind(this,'panel',true,true),true);
	}
	//setTimeout(this.test.bind(this),300);
	//this._stateobserve();
	//this.error('ERROR')
}
_stateobserve() {
	this._video.addEventListener('loadstart',this._videoinf.bind(this,false));
	var callback = function(e){this._videoinf(e.type)}.bind(this);
	this._video.addEventListener('loadedmetadata',callback);
	this._video.addEventListener('loadeddata',callback);
	this._video.addEventListener('canplay',callback);
	this._video.addEventListener('canplaythrough',callback);
	this._video.addEventListener('durationchange',callback);
	//video.addEventListener('error',this._event_error.bind(this));
}
_videoinf(ename) {
	if(ename===false) return this._controls.info.innerText = 'LOADSTART';
	var vs = this._sauce.getAttribute('src'),
		vw = this._video.videoWidth,
		vh = this._video.videoHeight,
		vd = Math.round(this.duration*1e3)/1e3,
		vt = this.currentTime,
		live = this.live;
	this._controls.info.innerText += '\n '+(ename?ename+' ':'')+vw+'x'+vh +' '+ vd;
}
test() {
	var src = '//www.cn.ru/data/files/test/countdown.mp4',
		//src = '/data/hls/playlist.m3u8',
		//src = '/data/hls/playlist30.m3u8',
		//src = 'http://tv.novotelecom.ru/channel/1kanal_hd/387/playlist.m3u8?sid=59e04d2c61419a13a2a97c8c77d353b3',
		//src = 'http://online.video.rbc.ru/online/rbctv_360p/index.m3u8',
		src = 'http://hls.novotelecom.ru/streaming/cam_lunintsev_sq/16/camv/playlist.m3u8',
		//src = 'http://hls.peers.tv/playlist/program/firstmuz/16/hd/20180428/124576907.m3u8',
		//src = 'http://hls.peers.tv/variant_playlist/program/125982261.m3u8',
		src = src;
	this.state(this._state = this.STATE_VIEW);
	this.load(src,false);
	//this.setTimeline(30,0,false);
	console.log('TEST');
}
set live(st) {
	if(st) this._sauce.setAttribute('livestream','');
	else this._sauce.removeAttribute('livestream');
	this._stage.classList[st?'add':'remove']('ss-livestream');
}
get live() {
	return null!==this._sauce.getAttribute('livestream');
}
setTimeline(dura, time, run) {
	this._controls.timeline.dura = dura;
	this._controls.timeline.time = time;
	this._controls.timeline.update();
	this._controls.timeline.pause(!this._video.paused);
	console.log('setTimeline:', dura, time, !!run);
return;
	var c = this.currentTime,
		c = c<0 ? 0 : Math.floor(c),
		t = this._controls.timeline,
		d = this._duration;
	t.dura = dura;
	t.time = time;
	t.seek = (dura!==Infinity);
	t.update().pause(!run);
	//setInterval(t.timer.bind(t), 2000);
	//t.timer();
}
_on_timeupdate(e) {
	var t = this._controls.timeline,
		time = this.currentTime;
	if (this._timeupdated === time) return;
	else this._timeupdated = time;
	t.timeup(time);
}
_hover(tar,state,permanent,e) {
	if(e) e.stopImmediatePropagation();
	if(tar=='panel' && e.type=='mousemove') return;
	//console.log('hover '+tar,state,!permanent);
	clearTimeout(this._hover_timeout);delete this._hover_timeout;
	if(state && !permanent) this._hover_timeout = setTimeout(this._hover_stop,2500);
	if(this._hover_state !== state) this.hover(this._hover_state = state);
}
hover(st) {
	this._stage.classList[st?'add':'remove']('hover');
	//console.log('HOVER',st);
}
hlsPlayType() {
	var cp = false, vp = document.createElement('video'),
	tp = ['application/vnd.apple.mpegURL','application/vnd.apple.mpegurl','application/x-mpegURL'];
	tp.forEach(function(v) {if(cp===false && vp.canPlayType(v)!=='') cp = v});
	return cp;
}
state(st) {
	//if(this._state===st && st===this.STATE_IDLE) return;
	this._stage.classList.remove('st-'+this._state.toLowerCase());
	this._stage.classList.add('st-'+st.toLowerCase());
	//console.log('state', this._state + ' > ' + st);
	this._state = st;
	return this;
}
pause(st) {
	var st = typeof st ==='boolean' ? st : !this._video.paused;
	//console.log('pause',st);
	this._video[st?'pause':'play']();
	this._event_playing();
}
size() {
	var vf = this._video.style.objectFit;
	this._video.style.objectFit = vf!=='contain' ? 'contain' : 'cover';
}
mute(st) {
	var st = typeof(st)=='boolean' ? st : !this._video.muted;
	this._video.muted = st;
	if(st) this._video.setAttribute('muted','');
	else this._video.removeAttribute('muted');
	this._on_volumechange();
}
stop() {
	this._hlsjs.stopLoad();
	this.pause(true);
	//this.seek(0);
}
load(src, live, play) {
//return;
	//this.trace('load '+(!this._ready ? 'defer':'start'), 'src: "'+src+'"');
	//if(!this._ready) return this._onready_load = this.load.bind(this,src);
	this.stop();
	this.error(false);
	this._hlsjs.detachMedia(this._video);
	delete this._hls_live;
	delete this._duration;
	delete this._livetime;
	delete this._playready;
	delete this._playstart;
	this.state(this.STATE_LOAD);

	var live = (src!==null && true===live),
		play = (src!==null && true===play);

	if(src===null) {
		this._sauce.removeAttribute('src');
		this._video.removeAttribute('src');
	} else {
		this._sauce.setAttribute('src', src);
		this._video.setAttribute('src', src);
	}
	this.live = live;

	if(play) this._video.setAttribute('autoplay','');
	else this._video.removeAttribute('autoplay','');

	var hls = /\.(m3u8|m3u)(?:\?|$)/.test(src);
	if(src===null) {
		this._sauce.removeAttribute('type');
		this._video.load();
		return this.state(this.STATE_VOID);
	}
	else if(!hls) {
		this._sauce.removeAttribute('type');
		this._video.load();
	} else if(this._hls_type) {
		this._sauce.setAttribute('type',this._hls_type);
		this._video.load();
	} else {
		this._sauce.setAttribute('type','application/x-mpegURL');
		this._hlsjs.attachMedia(this._video);
	}
	//setTimeout(function(){console.log('currentTime:5');this._video.currentTime = 5;}.bind(this),1500);
}
play(src,live) {
	//console.log('PLAY',src,live);
	this.load(src, live, true);
}
reload() {
	var src = this._sauce.getAttribute('src');
	this.play(src, this.live, true);
}
seek(p) {
	var d = this.duration,
		t = Math.round(1e3*d*p)/1e3;
	console.log('SEEK', p, d, t);
	this.currentTime = t;
}
title(data) {
	var data = data || {};
	if(data.time) data.time = data.time ? data.time.format('dddd, d mmmm h:nn') : false;
	if(data.logo) this._title.logo.src = data.logo || 'app/img/logo96x96.png';
	if(data.name) this._title.name.innerText = data.name || 'Channel name';
	if(data.time) this._title.time.innerText = data.time || 'Friday, 42 November 36:88';
	if(data.desc) this._title.desc.innerText = data.desc || 'Telecast title';
}
createVideoElement() {
	
	var video = document.createElement('video'),
		sauce = document.createElement('source'),
		hlsjs = new Hls({});

	sauce.setAttribute('type','application/x-mpegURL');
	//video.setAttribute('preload','none');
	video.setAttribute('height','100%');
	video.setAttribute('width','100%');
	//video.setAttribute('controls','');
	video.removeAttribute('controls');
	video.removeAttribute('autoplay');
	video.setAttribute('muted','');
	video.appendChild(this._sauce = sauce);

	video.addEventListener('loadedmetadata',this._event_metadata.bind(this));
	video.addEventListener('loadeddata',this._event_metadata.bind(this));
	//video.addEventListener('canplay',this._event_metadata.bind(this));
	//video.addEventListener('canplaythrough',this._event_metadata.bind(this));
	video.addEventListener('timeupdate',this._on_timeupdate.bind(this));
	
	video.addEventListener('durationchange',this._on_durachange.bind(this));
	video.addEventListener('volumechange',this._on_volumechange.bind(this));
	//video.addEventListener('seeked',this._on_seeked.bind(this));
	video.addEventListener('ended',this._on_ended.bind(this));

	video.addEventListener('canplay',this._event_playready.bind(this));
	video.addEventListener('error',this._event_error.bind(this));

	video.addEventListener('playing',this._event_playstart.bind(this));
	video.addEventListener('pause',this._event_playing.bind(this));
	video.addEventListener('play',this._event_playing.bind(this));

	// observe buffering state
	video.addEventListener('waiting',this._event_waiting.bind(this,true));
	hlsjs.on(Hls.Events.ERROR,this._event_waiting.bind(this,false));
	var buffering_done = this._event_waiting.bind(this,false),
		bufdone_events = ['playing','suspend','emptied','seeked','error'];
	bufdone_events.forEach(function(en){video.addEventListener(en,buffering_done)});

	hlsjs.on(Hls.Events.ERROR,this._hlsjs_error.bind(this));
	hlsjs.on(Hls.Events.MANIFEST_PARSED,function(){hlsjs.startLoad(-1)});
	hlsjs.on(Hls.Events.LEVEL_UPDATED,function(ename,event) {
		var live = !!event.details.live;// for duration
		if (live !== this._hls_live) this._hls_live = live;
	}.bind(this));

	hlsjs.on(Hls.Events.MEDIA_ATTACHED,function(e){
		var src = sauce.getAttribute('src');
		if(null!=src) hlsjs.loadSource(src);
		//console.log(e, src);
	});

	this._hlsjs = hlsjs;
	this._hlsjs.attachMedia(video);
	return video;
}
attachEvent(ename, callback) {
	this._video.addEventListener(ename,function(e){callback(e)});
}
dispatchVideoEvent(ename) {
	var detail = Object.assign({},{'time':Date.now()});
	var event = new CustomEvent(ename,{detail:detail});
	this._video.dispatchEvent(event);
}
_event_playready(e) {
	if (this._playready) return;
	else this._playready = true;
	this.state(this.STATE_VIEW);

	var d = this._video.duration,
		t = this._video.currentTime;
	if(t>0) this._hls_timeshift = t;
	else delete this._hls_timeshift;

	var vs = this._sauce.getAttribute('src'),
		vw = this._video.videoWidth,
		vh = this._video.videoHeight,
		vd = this.duration,
		vt = this.currentTime,
		live = (vd===Infinity),
		live = this.live;
	
	this._videoinf();
	console.log('playready/'+e.type, vs, vw+'x'+vh, live?'live':(vd+'s'), vt);
	//this.setTimeline(vd, vt, false);
	this.dispatchVideoEvent('playready');
}
_event_playstart(e) {
	if (this._playstart) return;
	else this._playstart = true;
	this.dispatchVideoEvent('playstart');
}
_event_waiting(st,e) {
	if(this._is_waiting === st) return;
	//console.log('wait', (e?e.type:'custom'), this._is_waiting, st);
	this._stage.classList[st?'add':'remove']('ps-wait');
	this._is_waiting = st;
}
_event_metadata(e) {
	var v = this._video,
		vs = v.currentSrc,
		vw = v.videoWidth,
		vh = v.videoHeight,
		vd = true===this._hls_live ? Infinity : v.duration,
		dr = Math.floor(vd);
	//console.log('META', this._hls_live, e.type, vw+'x'+vh, dr);
}
_hlsjs_error(e,err) {
	if(err && err.type == 'mediaError') {
		if(err.details == 'bufferSeekOverHole') return;
		if(err.details == 'bufferStalledError') return;
		if(err.details == 'bufferNudgeOnStall') return;
	}

	var txt = 'Hlsjs error ['+err.type+']\n'+err.details;
	this.error(txt);
}
_event_error(e) {
	var err = this._video.error,
		txt = 'Video error ['+err.code+']\n'+err.message;
	this.error(txt);
}
error(txt) {
	if(txt) this.state(this.STATE_FAIL);
	this._controls.error.firstChild.innerText = txt || '';
	this._controls.error.style.display = txt ? null : 'none';
}
get duration() {
	//if(this._hls_live) return Infinity;
	if(this.live) return Infinity;
	else return this._video.duration;
}
set duration(t) {this._duration = t}
set livetime(t) {this._livetime = t}
livestream(dura,time) {
	if(dura===false) return this.live = false;
	else this.live = true;
	this.duration = dura;
	this.livetime = time;
	//console.log('livestream:', dura, time);
}
get currentTime() {
	var s = this._hls_timeshift || 0,
		lt = this._livetime || 0,
		ct = this._video.currentTime,
		st = lt + ct - s;
	return st<0 ? 0 : st;
}
set currentTime(t) {
	var ct = t;
	this._video.currentTime = ct;
}
playtime() {
	var s = this._hls_timeshift || 0,
		t = this._video.currentTime - s;
	//console.log(s, this._video.currentTime, t);
	return this._video.currentTime;
	//return t;
}
position() {
	var d = this.duration,
		c = this.playtime();
	return Math.round(10000 * c/d)/10000;
}
_on_ended(e) {
	this.currentTime = 0;
}
_on_seeked(e) {
	var d = this.duration,
		c = this.playtime(),
		p = this.position();
	//console.log('seeked', d, c, p);
}
_on_durachange(e) {
	if(this.live) return;
	if(!this._playready) return;
	//if(this._video.duration<90) return;
	var d = parseInt(this._video.duration);
	if (isNaN(d)) return;
	else console.log('durachange',d);
	this.duration = d;
	this._controls.timeline.dura = d;
	this._controls.timeline.update();
}
_event_playing(e) {
	var paused = !!this._video.paused;
	this._stage.classList[paused?'add':'remove']('vs-pause');
	if(this.live) this._controls.timeline.pause(paused);
	//console.log('video paused',paused);
}
_on_volumechange(e) {
	var v = this._video.volume,
		m = this._video.muted;
	//console.log('volumechange', m, v);
	this._stage.classList[m?'add':'remove']('vs-muted');
}
createPanelElement() {
	var wrapper = document.createElement('div'),
		ctpanel = document.createElement('div');

	var spinner = document.createElement('s');
	spinner.appendChild(document.createElement('s'));

	var btnplay = document.createElement('button');
	btnplay.addEventListener('click',this.pause.bind(this,null));

	var timeline = new Timeline(this._video);
	timeline.onseek(this.seek.bind(this));
	ctpanel.appendChild(timeline.node);

	var over = document.createElement('sup');
	over.addEventListener('click',this.pause.bind(this,null));
	this._stage.appendChild(over);

	var type = document.createElement('sub');
	type.innerText = this._hls_type||'hlsjs';
	this._stage.appendChild(type);
	var info = document.createElement('sub');
	info.innerText = 'info';
	this._stage.appendChild(info);

	var eror = document.createElement('p'),
		eror_tx = document.createElement('span'),
		eror_re = document.createElement('button'),
		eror_bk = document.createElement('button');
	eror.appendChild(eror_tx);
	eror.appendChild(eror_re);eror_re.innerText = 'Retry';
	eror_re.addEventListener('click',this.reload.bind(this,false));
	this._stage.appendChild(eror);

	var play = document.createElement('button');
	play.setAttribute('class','play');
	play.addEventListener('click',this.pause.bind(this,null));

	var size = document.createElement('button');
	size.addEventListener('click',this.size.bind(this));
	size.setAttribute('class','size');

	var mute = document.createElement('button');
	mute.addEventListener('click',this.mute.bind(this));
	mute.setAttribute('class','mute');

	ctpanel.appendChild(mute);
	ctpanel.appendChild(play);
	ctpanel.appendChild(size);

	wrapper.appendChild(ctpanel);
	wrapper.setAttribute('class','cntrls');
	return {
		//dura: tr,
		//time: tl,
		//text: sp,
		info: info,
		mute: mute,
		error: eror,
		btnplay: btnplay,
		spinner: spinner,
		timeline: timeline,
		panel: ctpanel,
		wrapper: wrapper
	};
}
createTitleElement() {
	var title = {};
	var wrapper = document.createElement('header'),
		i = document.createElement('i'),
		name = document.createElement('b'),
		time = document.createElement('time'),
		desc = document.createElement('span'),
		logo = document.createElement('img');
	
	i.appendChild(title.logo = logo);
	wrapper.appendChild(i);
	wrapper.appendChild(title.name = name);
	wrapper.appendChild(title.time = time);
	wrapper.appendChild(title.desc = desc);
	title.name.innerText = 'Московский образовательный интернет-телеканал';
	title.time.innerText = 'Friday, 13 November 12:33';
	title.desc.innerText = 'Маленькое королевство Бена и Холли (Ben and Holly`s Little Kingdom)';
	title.el = wrapper;
	return title;
}
};

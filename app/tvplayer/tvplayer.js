'use strict';
class Tvplayer {
constructor(container) {
	this.STATE_IDLE = 'IDLE';
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
	
	this._controls = this.controls();
	this._stage.appendChild(this._controls.spinner);
	this._stage.appendChild(this._controls.btnplay);
	this._stage.appendChild(this._controls.panel);

	this._stage.setAttribute('class','tvplayer');
	this.container.appendChild(this._stage);
	this.state(this._state = this.STATE_IDLE);
	this.error(false);
	this.pause(true);
	this.mute(true);

	var src = '//www.cn.ru/data/files/test/countdown.mp4',
		//src = 'http://online.video.rbc.ru/online/rbctv_360p/index.m3u8',
		//src = 'http://hls.novotelecom.ru/streaming/cam_lunintsev_sq/16/camv/playlist.m3u8',
		//src = 'http://hls.peers.tv/playlist/program/firstmuz/16/hd/20180428/124576907.m3u8',
		//src = 'http://hls.peers.tv/variant_playlist/program/125982261.m3u8',
		src = src;
	var load = this.load.bind(this,src,false);
	setTimeout(load,300);
	//this.state(this._state = this.STATE_VIEW);
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
	console.log('state', this._state + ' > ' + st);
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
	//this.pause(true);
	//this.seek(0);
}
load(src,autoplay) {
//return;
	//this.trace('load '+(!this._ready ? 'defer':'start'), 'src: "'+src+'"');
	//if(!this._ready) return this._onready_load = this.load.bind(this,src);
	this.stop();
	this._hlsjs.detachMedia(this._video);
	delete this._hls_live;
	delete this._playready;
	this.state(this.STATE_LOAD);

	if(src===null) {
		this._sauce.removeAttribute('src');
		this._video.removeAttribute('src');
	} else {
		this._sauce.setAttribute('src', src);
		this._video.setAttribute('src', src);
	}

	if(true===autoplay) this._video.setAttribute('autoplay','');
	else this._video.removeAttribute('autoplay','');

	var hls = /\.(m3u8|m3u)(?:\?|$)/.test(src);
	if(!hls) {
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
play(src) {
	console.log('PLAY',src);
	this.load(src,true);
}
seek(p) {
	var d = this.duration(),
		st = Math.round(1e3*d*p)/1e3;
	this._video.currentTime = st;
	//console.log('SEEK', p, st);
}
createVideoElement() {
	
	var video = document.createElement('video'),
		sauce = document.createElement('source'),
		hlsjs = new Hls({});

	sauce.setAttribute('type','application/x-mpegURL');
	video.setAttribute('preload','none');
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
	
	video.addEventListener('durationchange',this._on_durachange.bind(this));
	video.addEventListener('volumechange',this._on_volumechange.bind(this));
	video.addEventListener('seeked',this._on_seeked.bind(this));
	video.addEventListener('ended',this._on_ended.bind(this));

	video.addEventListener('canplay',this._event_playready.bind(this));
	video.addEventListener('error',this._event_error.bind(this));

	//video.addEventListener('playing',this._event_playing.bind(this));
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
_event_playready(e) {
	if (this._playready) return;
	else this._playready = true;
	
	var d = this.duration();
	this._controls.timeline.duration(d);

	this.state(this.STATE_VIEW);
	if(e) console.log('playready ' + e.type);
	dispatchEvent('playready');
}
_event_waiting(st,e) {
	if(this._is_waiting === st) return;
	console.log('WAIT', (e?e.type:'custom'), this._is_waiting,st);
	this._stage.classList[st?'add':'remove']('ps-wait');
	this._is_waiting = st;
}
_event_metadata(e) {
	//if(e.type=='playing')
	var v = this._video,
		vs = v.currentSrc,
		vw = v.videoWidth,
		vh = v.videoHeight,
		vd = true===this._hls_live ? Infinity : v.duration,
		dr = Math.floor(vd);
	console.log('META', this._hls_live, e.type, vw+'x'+vh, dr);
	//this._controls.text.innerText = ''+e.type+' '+vw+'x'+vh+' '+dr;

	//if(!isNaN(dr) && dr>0) this._controls.dura.innerText = dr;
}
_hlsjs_error(e,err) {
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
	this._controls.error.innerText = txt || '';
	this._controls.error.style.display = txt ? null : 'none';
}
duration() {
	if(this._hls_live) return Infinity;
	var dt = this._video.duration,
		dt = Math.round(1e3*dt)/1e3;
	return dt;
}
playtime() {
	return this._video.currentTime;
}
position() {
	var d = this.duration(),
		c = this.playtime();
	return Math.round(10000 * c/d)/10000;
}
_on_ended(e) {
	this._video.currentTime = 0;
}
_on_seeked(e) {
	var d = this.duration(),
		c = this.playtime(),
		p = this.position();
	//console.log('seeked', d, c, p);
}
_on_durachange(e) {
	//var d = this._video.duration;
	//this._controls.time.innerText = d;
}
_on_timeupdate(e) {
	console.log('time',e)
	this._controls.timeline.time(this.position());
}
_event_playing(e) {
	var play = !this._video.paused;
	this._stage.classList[!play?'add':'remove']('vs-pause');
	//console.log('play',play);
}
_on_volumechange(e) {
	var v = this._video.volume,
		m = this._video.muted;
	//console.log('volumechange', m, v);
	this._stage.classList[m?'add':'remove']('vs-muted');
}
controls() {
	var wrapper = document.createElement('div');

	var spinner = document.createElement('s');
	spinner.appendChild(document.createElement('s'));

	var btnplay = document.createElement('button');
	btnplay.addEventListener('click',this.pause.bind(this,null));

	var timeline = new Timeline(this._video);
	timeline.node.addEventListener('seek',function(e){this.seek(e.detail)}.bind(this));
	wrapper.appendChild(timeline.node);

	var over = document.createElement('sup');
	over.innerText = this._hls_type||'hlsjs';
	over.addEventListener('click',this.pause.bind(this,null));
	this._stage.appendChild(over);
	var type = document.createElement('sub');
	type.innerText = this._hls_type||'hlsjs';
	this._stage.appendChild(type);

	var eror = document.createElement('p');
	eror.addEventListener('click',this.error.bind(this,false));
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

	wrapper.appendChild(mute);
	wrapper.appendChild(play);
	wrapper.appendChild(size);

	wrapper.setAttribute('class','cntrls');
	return {
		//dura: tr,
		//time: tl,
		//text: sp,
		mute: mute,
		error: eror,
		btnplay: btnplay,
		spinner: spinner,
		timeline: timeline,
		panel: wrapper
	};
}
};

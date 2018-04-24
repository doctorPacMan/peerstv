'use strict';
class Tvplayer {
constructor(container) {
	this.STATE_IDLE = 'IDLE';
	this.STATE_LOAD = 'LOAD';
	this.STATE_FAIL = 'FAIL';
	this.STATE_VIEW = 'VIEW';
	this._hls_type = this.hlsPlayType();
	//console.log('Tvplayer', this._hls_type || 'hlsjs');

	var container = document.getElementById(container);
	this.container = container;
	this._stage = document.createElement('div');
	this._video = this.createVideoElement();
	this._stage.appendChild(this._video);
	
	this._spinner = document.createElement('s');
	this._spinner.appendChild(document.createElement('s'));
	this._stage.appendChild(this._spinner);

	var over = document.createElement('sup');
	this._stage.appendChild(over);
	this._stage.appendChild(this.controls());

	this._stage.setAttribute('class','tvplayer');
	this.container.appendChild(this._stage);
	this.state(this._state = this.STATE_IDLE);

	var play = this.load.bind(this,'//www.cn.ru/data/files/test/countdown.mp4',false);
	//var play = this.play.bind(this,'http://online.video.rbc.ru/online/rbctv_480p/index.m3u8');
	//var play = this.play.bind(this,'http://hls.novotelecom.ru/streaming/cam_lunintsev_sq/16/camv/playlist.m3u8');
	setTimeout(play,300);
}
hlsPlayType() {
	var cp = false, vp = document.createElement('video'),
	tp = ['application/vnd.apple.mpegURL','application/vnd.apple.mpegurl','application/x-mpegURL'];
	tp.forEach(function(v) {if(cp===false && vp.canPlayType(v)!=='') cp = v});
	return cp;
}
state(st) {
	this._stage.classList.remove('st-'+this._state.toLowerCase());
	this._stage.classList.add('st-'+st.toLowerCase());
	this._state = st;
}
pause(st) {
	var st = typeof st ==='boolean' ? st : !this._video.paused;
	console.log('pause',st);
	this._video[st?'pause':'play']();
}
size() {
	var vf = this._video.style.objectFit;
	this._video.style.objectFit = vf!=='contain' ? 'contain' : 'cover';
}
mute() {

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
}
play(src) {
	console.log('PLAY',src);
	this.load(src,true);
}
createVideoElement() {
	
	var video = document.createElement('video'),
		sauce = document.createElement('source'),
		hlsjs = new Hls({});

	sauce.setAttribute('type','application/x-mpegURL');
	//sauce.setAttribute('src','');
	//video.setAttribute('src',sauce.getAttribute('src'));
	video.setAttribute('preload','metadata');
	video.setAttribute('height','100%');
	video.setAttribute('width','100%');
	video.setAttribute('controls','');
	//video.setAttribute('autoplay','');
	//video.removeAttribute('autoplay');
	video.setAttribute('muted','');video.muted = true;
	video.appendChild(this._sauce = sauce);

	video.addEventListener('canplay',this._event_playready.bind(this));
	video.addEventListener('error',this._event_error.bind(this));

	// observe buffering state
	video.addEventListener('waiting',this._event_waiting.bind(this,true));
	hlsjs.on(Hls.Events.ERROR,this._event_waiting.bind(this,false));
	var buffering_done = this._event_waiting.bind(this,false),
		bufdone_events = ['playing','suspend','emptied','seeked','error'];
	bufdone_events.forEach(function(en){video.addEventListener(en,buffering_done)});

	hlsjs.on(Hls.Events.ERROR,this._event_error.bind(this));
	hlsjs.on(Hls.Events.MANIFEST_PARSED,function(){hlsjs.startLoad(-1)});
	hlsjs.on(Hls.Events.MEDIA_ATTACHED,function(e){
		var src = sauce.getAttribute('src');
		if(null!=src) hlsjs.loadSource(src);
		//console.log(e, src);
	});

	this._hlsjs = hlsjs;
	this._hlsjs.attachMedia(video);
	return video;
}
_event_error() {
	this.state(this.STATE_FAIL);
}
_event_playready() {
	this.state(this.STATE_VIEW);
	//dispatchEvent('playready');
}
_event_waiting(st,e) {
	//console.log('BUFF',(e?e.type:'custom'),this._is_waiting,st);
	if(this._is_waiting === st) return;
	else this._is_waiting = st;
}
controls() {

	var cntrplay = document.createElement('button');
	cntrplay.addEventListener('click',this.pause.bind(this,null));
	this._stage.appendChild(cntrplay);

	var wrapper = document.createElement('div');	

	var play = document.createElement('button');
	play.addEventListener('click',this.pause.bind(this,null));
	play.setAttribute('class','play');
	wrapper.appendChild(play);

	var time = document.createElement('time');
	time.innerText = '00:00:00';
	wrapper.appendChild(time);

	var size = document.createElement('button');
	size.addEventListener('click',this.size.bind(this));
	size.setAttribute('class','size');
	wrapper.appendChild(size);

	var mute = document.createElement('button');
	mute.addEventListener('click',this.mute.bind(this));
	mute.setAttribute('class','mute');
	wrapper.appendChild(mute);

	var bar = document.createElement('div');
	wrapper.appendChild(bar);

	wrapper.setAttribute('class','cntrls');
	return wrapper;
}
};
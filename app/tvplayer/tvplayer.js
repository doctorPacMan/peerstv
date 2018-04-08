'use strict';
class Tvplayer {
constructor(container) {

	this._hls_type = this.hlsPlayType();
	console.log('Tvplayer',this._hls_type);

	var container = document.getElementById(container);
	this._video = this.createVideoElement();
	container.appendChild(this._video);

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
stop(){
	this._hlsjs.stopLoad();
	//this.pause(true);
	//this.seek(0);
}
load(src,autoplay) {

	//this.trace('load '+(!this._ready ? 'defer':'start'), 'src: "'+src+'"');
	//if(!this._ready) return this._onready_load = this.load.bind(this,src);
	this.stop();
	this._hlsjs.detachMedia(this._video);

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
	video.setAttribute('muted','');
	video.setAttribute('controls','');
	//video.setAttribute('autoplay','');
	//video.removeAttribute('autoplay');
	video.appendChild(this._sauce = sauce);

	// observe buffering state
	video.addEventListener('waiting',this._event_waiting.bind(this,true));
	hlsjs.on(Hls.Events.ERROR,this._event_waiting.bind(this,false));
	var buffering_done = this._event_waiting.bind(this,false),
		bufdone_events = ['playing','suspend','emptied','seeked','error'];
	bufdone_events.forEach(function(en){video.addEventListener(en,buffering_done)});

	hlsjs.on(Hls.Events.MEDIA_ATTACHED,function(e){
		var src = sauce.getAttribute('src');
		if(null!=src) hlsjs.loadSource(src);
		//console.log(e, src);
	});
	hlsjs.on(Hls.Events.MANIFEST_PARSED,function(){
		//console.log('MANIFEST_PARSED',e);
		//video.play();
	});	

	this._hlsjs = hlsjs;
	this._hlsjs.attachMedia(video);
	return video;
}
_event_waiting(st,e) {
	//console.log('BUFF',(e?e.type:'custom'),this._is_waiting,st);
	if(this._is_waiting === st) return;
	else this._is_waiting = st;
}
};
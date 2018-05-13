class Timeline {
constructor(video) {
	console.log('Timeline',video);
	var u = document.createElement('u'),
		b = document.createElement('b'),
		s = document.createElement('span'),
		tl = document.createElement('time'),
		tr = document.createElement('time'),
		wrapper = document.createElement('div');

	tl.innerText = tr.innerText = '0:00:00';
	s.innerText = 'timeline';

	this._N = {
		wrp: wrapper,
		dura: tr,
		time: tl,
		line: u,
		dot: b
	};

	wrapper.setAttribute('class','timeline');
	wrapper.appendChild(u);
	wrapper.appendChild(b);
	wrapper.appendChild(s);
	wrapper.appendChild(tl);
	wrapper.appendChild(tr);
	//wrapper.addEventListener('click',this._click.bind(this),false);

	if('ontouchstart' in wrapper) this._observeTouchSeek(wrapper);
	else this._observeMouseSeek(wrapper);

	video.addEventListener('seeked',this.update.bind(this));
	video.addEventListener('play',this._on_playing.bind(this));
	video.addEventListener('pause',this._on_playing.bind(this));
	video.addEventListener('timeupdate',this._on_time.bind(this));
	this._video = video;
	this.node = wrapper;
	this._duration;
}
_click(e) {
	if(this._duration===Infinity) return;
	var w = this._N.wrp.offsetWidth,
		x = e.offsetX,
		p = Math.round(1000 * x/w)/1000;
	this.position(p);
	//console.log('click',p);

	var event = new CustomEvent('seek',{'detail':p});
	this._N.wrp.dispatchEvent(event);
}
_on_time(e) {
	var t = Math.ceil(this._video.currentTime);
	this._N.time.innerText = this.sec2time(t);
}
_on_playing(e) {
	var p = !this._video.paused,
		d = this._duration,
		t = this._video.currentTime,
		v = Math.round(1e4*t/d)/1e2;
	console.log('playing', p, d, t);
	this.paused(p);
}
paused(p) {
	var ps = p ? 'running' : 'paused';
	this._N.line.style.animationPlayState = ps;
	//this._N.line.style.animation = 'timeline-s '+t+'s 0s 1 linear normal none running';
}
duration(d) {
	this._duration = d;
	return this.update();
}
position(v) {
	this._N.dot.style.left = (v*1e2) + '%';
}
update(dt, ct) {
	var d = this._duration,
		c = this._video.currentTime,
		v = Math.ceil(1e5 * c/d)/1e3,
		ms = Math.round((d-c)*1e3);
	
	//console.log('UPD','d:'+d,'ct:'+c, v+'%', ms+'ms');
	this._N.time.innerText = this.sec2time(c);
	this._N.dura.innerText = this.sec2time(d);

	var old = this._N.line,
		neu = old.cloneNode(false);
	if(ms===Infinity) {
		neu.style.animationDuration = '0ms';
		neu.style.width = '0%';
	} else {
		neu.style.animationDuration = ms+'ms';
		neu.style.width = v + '%';
	}
	old.parentNode.replaceChild(this._N.line = neu, old);
	return this;
}
sec2time(sec) {
	var time='', s=sec, m, h;
	if(s===Infinity) return '--:--';
	if(false) h = 0; // Like Chrome - 000:00
	else h = Math.floor(s/3600);
	m = Math.floor((s = s - h*3600)/60);
	s = Math.floor(s - m*60);
	if(h>0)time += (h + ':');
	//time += (h<10?('0'+h):h)+':';
	time += (m<10?('0'+m):m)+':'+(s<10?('0'+s):s);
	//console.log('sec2time',sec,time,h,m,s);
	return time;

	//return sec;
}
_observeMouseSeek(elem) {
	elem.addEventListener('mouseup',this._mouse_seek.bind(this,false),false);
	elem.addEventListener('mousedown',this._mouse_seek.bind(this,true),false);
	elem.addEventListener('mouseleave',this._mouse_seek.bind(this,false),false);
	elem.addEventListener('mousemove',this._mouse_move.bind(this),false);
}
_observeTouchSeek(elem) {
	elem.addEventListener('touchcancel',this._touch_seek.bind(this,false),false);
	elem.addEventListener('touchstart',this._touch_seek.bind(this,true),false);
	elem.addEventListener('touchend',this._touch_seek.bind(this,false),false);
	elem.addEventListener('touchmove',this._touch_move.bind(this),false);
}
_mouse_seek(st, e) {
	var observe = st===true;
	if (this._seek_observed == observe) return;
	else this._seek_observed = observe;
	this._N.wrp.classList[observe?'add':'remove']('hover');
	//console.log(st, e.type);
	if(observe) this._mouse_move(e);
	else if(e.type=='mouseleave') console.log('cancel');
	else this._seekcomplete(this._seek_position);
}
_touch_seek(st,e) {
	var observe = st===true;
	if (this._seek_observed == observe) return;
	else this._seek_observed = observe;
	this._N.wrp.classList[st?'add':'remove']('hover');
	//console.log(st, e.type);
	if(observe) this._touch_move(e);
	else if(e.type=='touchcancel') console.log('cancel');
	else this._seekcomplete(this._seek_position);
}
_mouse_move(e) {
	if(!this._seek_observed) return;
	var x = e.offsetX,
		w = this._N.wrp.offsetWidth;
	this._seekmove(x/w);
}
_touch_move(e) {
	if(!this._seek_observed) return;
	var wrp = this._N.wrp,
		tx = e.changedTouches[0].clientX,
		dx = wrp.getBoundingClientRect().left,
		w = wrp.offsetWidth,
		x = tx - dx;
	this._seekmove(x/w);
}
_seekcomplete(v) {
	//console.log('submit',this._seek_position);
	if(this._seek_callback) this._seek_callback(this._seek_position);
	delete this._seek_position;
	delete this._seek_observed;
}
_seekmove(v) {
	var sx = v<0 ? 0 : (v>1 ? 1 : Math.round(1e5*v)/1e5);
	this._N.dot.style.left = (sx * 1e2) + '%';
	this._seek_position = sx;
	//console.log(sx);
}
onseek(callback) {
	if(typeof callback === 'function') this._seek_callback = callback;
	else delete this._seek_callback;
	return this;
}
};
class Timeline {
constructor() {

	var u = document.createElement('u'),
		b = document.createElement('b'),
		s = document.createElement('span'),
		ts = document.createElement('sup'),
		tl = document.createElement('time'),
		tr = document.createElement('time'),
		wrapper = document.createElement('div');

	ts.innerText = tl.innerText = tr.innerText = '0:00:00';
	s.innerText = 'timeline';

	this._N = {
		wrp: wrapper,
		dura: tr,
		time: tl,
		seek: ts,
		line: u,
		dota: b
	};

	wrapper.setAttribute('class','timeline');
	wrapper.appendChild(u);
	//wrapper.appendChild(b);
	wrapper.appendChild(s);
	wrapper.appendChild(ts);
	wrapper.appendChild(tl);
	wrapper.appendChild(tr);
	//wrapper.addEventListener('click',this._click.bind(this),false);

	if('ontouchstart' in wrapper) this._observeTouchSeek(wrapper);
	else this._observeMouseSeek(wrapper);

	this.node = wrapper;
	this._dura;
	this._time;
	this._seek_allow = true;
}
_click(e) {
	if(this._duration===Infinity) return;
	var w = this._N.wrp.offsetWidth,
		x = e.offsetX,
		p = Math.round(1e3 * x/w)/1e3;
	this.position(p);
	//console.log('click',p);

	var event = new CustomEvent('seek',{'detail':p});
	this._N.wrp.dispatchEvent(event);
}
timeup(t) {
	//var t = Math.ceil(this._currentTime());
	this._N.time.innerText = this.sec2time(t);
}
_currentTime() {
	var ct = this._video.currentTime;
	if(this._livetime) ct += this._livetime;
	return ct;
}
pause(st) {
	var st = st===true,
		ps = st ? 'paused' : 'running';
	//this._N.line.style.animation = 'timeline-s '+t+'s 0s 1 linear normal none running';
	this._N.line.style.animationPlayState = ps;
	this._N.wrp.classList[st?'add':'remove']('paused');
	this.paused = st;
	return this;
}
set time(ts) {this._time = ts}
get time() {return this._time}
set dura(ts) {this._dura = ts}
get dura() {return this._dura}
duration(d) {
	this._duration = d;
	return this.update();
}
livetime(t) {
	this._livetime = t;
	return this.update();
}
position(v) {}
update() {

	var d = this._dura,
		t = this._time;

	var old = this._N.line,
		neu = old.cloneNode(false),
		v = Math.ceil(1e5 * t/d)/1e3,
		ms = Math.round((d-t)*1e3);

	this._N.dura.innerText = this.sec2time(d);
	this._N.time.innerText = this.sec2time(t);

	neu.style.width = v + '%';
	neu.style.animationDuration = ms + 'ms';
	old.parentNode.replaceChild(this._N.line = neu, old);
	//console.log('timeline.update', d, t);
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
_observeMouseSeek(elem, st) {

	if(undefined===this._mseek_observe) {
		this._cb_mseek_over = this._mouse_over.bind(this);
		this._cb_mseek_move = this._mouse_move.bind(this);
		this._cb_mseek_true = this._mouse_seek.bind(this,true);
		this._cb_mseek_false = this._mouse_seek.bind(this,false);
	}
	this._mseek_observe = st;

	if(st) {
		elem.addEventListener('mousemove',this._cb_mseek_over,false);
		elem.addEventListener('mousemove',this._cb_mseek_move,false);
		elem.addEventListener('mouseup',this._cb_mseek_false,false);
		elem.addEventListener('mousedown',this._cb_mseek_true,false);
		elem.addEventListener('mouseleave',this._cb_mseek_false,false);
	} else {
		elem.removeEventListener('mousemove',this._cb_mseek_over,false);
		elem.removeEventListener('mousemove',this._cb_mseek_move,false);
		elem.removeEventListener('mouseup',this._cb_mseek_false,false);
		elem.removeEventListener('mousedown',this._cb_mseek_true,false);
		elem.removeEventListener('mouseleave',this._cb_mseek_false,false);
	}
	//console.log('mouse seek observe', this._mseek_observe);
}
_observeTouchSeek(elem, st) {
	elem.addEventListener('touchcancel',this._touch_seek.bind(this,false),false);
	elem.addEventListener('touchstart',this._touch_seek.bind(this,true),false);
	elem.addEventListener('touchend',this._touch_seek.bind(this,false),false);
	elem.addEventListener('touchmove',this._touch_move.bind(this),false);
}
_mouse_over(e) {
	var b = this._N.dota,
		n = this._N.seek,
		w = this._N.wrp.offsetWidth,
		x = e.offsetX,
		p = x/w,
		t = this.dura * p,
		x = Math.round(p*1e5)/1e3;
	n.innerText = this.sec2time(t);
	n.style.left = x+'%';
	b.style.left = x+'%';

	//console.log('mouseover',w,this.dura, p,t,x);
}
_mouse_move(e) {
	if(!this._seek_observed) return;
	var x = e.offsetX,
		w = this._N.wrp.offsetWidth;
	this._seekmove(x/w);
	//console.log(e.type);
}
_mouse_seek(st, e) {
	if (!this._seek_allow) return;
	if (e.which!==1) return;
	var observe = st===true;
	if (this._seek_observed == observe) return;
	else this._seek_observed = observe;
	this._N.wrp.classList[observe?'add':'remove']('hover');
	//console.log(st, e.type);
	if(observe) this._mouse_move(e);
	else if(e.type=='mouseleave') {}//console.log('cancel');
	else this._seekcomplete(this._seek_position);
}
_touch_seek(st,e) {
	if (!this._seek_allow) return;
	var observe = st===true;
	if (this._seek_observed == observe) return;
	else this._seek_observed = observe;
	this._N.wrp.classList[st?'add':'remove']('hover');
	//console.log(st, e.type);
	if(observe) this._touch_move(e);
	else if(e.type=='touchcancel') console.log('cancel');
	else this._seekcomplete(this._seek_position);
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
	this._seek_position = sx;
	//console.log(sx);
}
onseek(callback) {
	if(typeof callback === 'function') this._seek_callback = callback;
	else delete this._seek_callback;
	return this;
}
set seek(st) {
	var wrapper = this.node;
	if('ontouchstart' in wrapper) this._observeTouchSeek(wrapper, st);
	else this._observeMouseSeek(wrapper, st);
	//console.log('seekable',st);
}
};
"use strict";
document.addEventListener('DOMContentLoaded',function(){
	var times = document.body.querySelectorAll('time[data-timeout]');
	//Array.from(times).forEach(time=>{new uiTimer(time)});
	//console.log();
});
class uiTimer {
constructor(node) {
	var timeout = node.getAttribute('data-timeout'),
		timeout = parseInt(timeout, 10);
	//console.log(node, timeout);
	node.innerText = this.sec2time(timeout);
	this.node = node;
	//this.start(3);
}
stop() {
	clearTimeout(this._timeout);
	clearInterval(this._interval);
	this.node.innerText = '--:--';
}
start(timeout) {
	this._initime = new Date();
	this._endtime = new Date(this._initime.getTime() + timeout*1e3);
	this._timeout = setTimeout(this.ticktack.bind(this,true), timeout*1e3);
	this._interval = setInterval(this.ticktack.bind(this),1000);
	this.ticktack();
}
ticktack(stop) {
	var t = new Date(),
		s = Math.round((this._endtime.getTime() - t.getTime())/1000);
	this.node.innerText = this.sec2time(s<0 ? 0 : s);

	if(isNaN(s) || s<=0) {
		clearInterval(this._interval);
		clearTimeout(this._timeout);
	}
	//console.log(s);
}
sec2time(sec) {
	var time='', s=sec, m, h;
	if(true) h = 0; // 000:00
	else h = Math.floor(s/3600);
	m = Math.floor((s = s - h*3600)/60);
	s = Math.floor(s - m*60);
	if(h>0) time += (h + ':');
	time += (m<10?('0'+m):m)+':'+(s<10?('0'+s):s);
	return time;
}
};

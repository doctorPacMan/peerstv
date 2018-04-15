'use strict';
class ModuleSchedule extends AppModule {
_constructor(){
	//console.log('ModuleSchedule', this.section);
	this.MORNING = 6;
	this._list = this.section.querySelector('ol.schedule');
	this._days = this.section.querySelector('.progdays > div');
	attachEvent('channel/play',this.onChannelPlay.bind(this));
	this.test();
}
test() {
	var days = [
		{"year":2018,"month":4,"day":10,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":11,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":12,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":13,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":14,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":15,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":16,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":17,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":18,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":19,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":20,"hour":0,"minute":0,"second":0,"timezone":25200}
		,{"year":2018,"month":4,"day":21,"hour":0,"minute":0,"second":0,"timezone":25200}
	];

	this.fillDates(days);
	//console.log(this._days);

}
onChannelPlay(e) {
	//console.log('onChannelPlay',e);
	var cnid = e.detail;
	this.channel = cnid;
	this.days();
	this.load();
}
update() {
	this.load('04/13/2018','10338207');
	//this.load(null,'22615442');
	//this.load(null,'10338207');
}
onclick(e) {
	console.log(e.target.getAttribute('datetime'));
	this.load(e.target.getAttribute('datetime'));
}
fillDates(data) {
	var old = Array.from(this._days.getElementsByTagName('time'));
	while(old.length) {let o = old.pop();this._days.removeChild(o)};

	var days = data.map(v=>{var d=Date.json(v);d.setHours(this.MORNING,0,0,0);return d});
	var tday = Date.current();
	
	var pm = this.MORNING;
	tday.setHours((tday.getHours()>=pm?pm:pm-24), 0, 0, 0);

	var df = document.createDocumentFragment();
	days.forEach(d=>{
		var tn = document.createElement('time');
		tn.onclick = this.onclick.bind(this);
		tn.innerText = d.format('d\nddd');
		tn.setAttribute('datetime',d.iso());
		if(tday.getTime()==d.getTime()) tn.classList.add('tday');
		df.appendChild(tn);
		//console.log(d.iso() +' > '+ d.rfc())
	});	
	this._days.appendChild(df);
	//console.log(data);
	//console.log(days);
	this.focusDay(tday);
}
days(cnid) {

	var cnid = cnid || this.channel,
		apiurl = $App.api.service('tv_guide').location;
	apiurl+= 'channels.json?channel='+cnid+'&fields=scheduledDates';
	//console.log('request.schedule', apiurl);
	XHR.request(apiurl,function(data){
		var cha = data.channels[0],
			days = cha.scheduledDates.map(d=>Date.json(d));
		this.fillDates(cha.scheduledDates);
		//this.focusDay();
	}.bind(this));
}
load(date,cnid) {

	var lis = Array.from(this._list.getElementsByTagName('li'));
	while(lis.length) {let li = lis.pop();this._list.removeChild(li)};

	var cnid = cnid || this.channel,
		day = date ? new Date(date) : Date.current(),
		pm = this.MORNING;
	day.setHours((day.getHours()>=pm?pm:pm-24), 0, 0, 0);

	var nxt = new Date(day.getTime() + 86400*1e3),
		apiurl = $App.api.service('tv_guide').location;
	apiurl+= 'schedule.json?channel='+cnid;
	apiurl+= '&dates='+day.format('yyyy-mm-dd')+','+nxt.format('yyyy-mm-dd');
	console.log('request.schedule', apiurl);
	XHR.request(apiurl, this.onload.bind(this,day));
}
onload(day, data) {
	//localStorage.setItem('schedule',JSON.stringify(data));

	var df = document.createDocumentFragment();
	var now = Date.current(),
		ntz = -60*now.getTimezoneOffset(),
		day_from = (new Date(day)).setHours(this.MORNING,0,0),
		day_ends = (new Date(day)).setHours(this.MORNING+24,0,0);
	//console.log(new Date(day_from), new Date(day_ends));
	data.telecastsList.forEach(v=>{
		var tvs = this.attachTelecast(v, now, ntz);
		if(tvs.ends<=day_from) return;
		if(tvs.time>=day_ends) return;
		
		var li = document.createElement('li'),
			a = document.createElement('a'),
			t = document.createElement('time'),
			s = document.createElement('span');
		var bar = document.createElement('s');
		bar.appendChild(document.createElement('u'));
		a.onclick = $App.playTelecast.bind($App,tvs.id);
		a.className = 'tlcbar';
		t.setAttribute('datetime',tvs.time.iso());
		t.innerText = tvs.time.format('h:nn');
		s.innerText = tvs.name;
		a.appendChild(t);
		a.appendChild(s);

		if(tvs.state!='PAST') a.appendChild(bar);
		if(tvs.state=='LIVE') a.classList.add('ps-live');
		if(tvs.state!='SOON') a.setAttribute('href','#past');

		li.appendChild(a);
		df.appendChild(li);
	});
	this._list.appendChild(df);
	this.focusDay(day);
}
focusDay(day) {
	//console.log(day);
	var crnt = this._days.querySelector('time.crnt'),
		times = this._days.querySelectorAll('time'),
		time;
	for(var i=0;i<times.length;i++) {
		let d = new Date(times[i].getAttribute('datetime'));
		time = times[i];
		if(d.getTime()==day.getTime()) break;
	}
	if(crnt) crnt.classList.remove('crnt');
	if(time) time.classList.add('crnt');
	
	var cx = this._days.offsetWidth - time.offsetWidth,
		sx = time.offsetLeft - cx/2;
	this._days.scrollLeft = sx<0 ? 0 : sx;
	//console.log(this._days.scrollLeft);
}
attachTelecast(json, now, ntz) {
	//json.date.timezone, ntz
	var tvshow = new Tvshow(json);
	//console.log(tvshow.state, tvshow.time, tvshow.name)
	return tvshow;
}
}
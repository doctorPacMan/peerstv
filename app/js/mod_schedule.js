'use strict';
class ModuleSchedule extends AppModule {
_constructor(){
	console.log('ModuleSchedule', this.section);
	this._list = this.section.querySelector('ol.schedule');
	attachEvent('channel/play',this.onChannelPlay.bind(this));
}
onChannelPlay(e) {
	//console.log('onChannelPlay',e);
	this.load(e.detail);
}
update() {
	//this.load('22615442','04/09/2018');
	//this.load('22615442');
	//this.load('10338207');
}
load(cnid, day) {

	var lis = Array.from(this._list.getElementsByTagName('li'));
	while(lis.length) {let li = lis.pop();this._list.removeChild(li)};

	var day = day ? new Date(day) : new Date,
		nxt = new Date(day.getTime() + 86400* 1000),
		day_url = day.format('yyyy-mm-dd'),
		nxt_url = nxt.format('yyyy-mm-dd');

	//var ss = localStorage.getItem('schedule');
	//if(ss) return this.onload(day, JSON.parse(ss));

	var apiurl = $App.api.service('tv_guide').location;
	apiurl+= 'schedule.json?channel='+cnid+'&dates='+day_url+','+nxt_url;
	console.log('request.schedule', apiurl);
	XHR.request(apiurl, this.onload.bind(this,day));

}
onload(day, data) {
	localStorage.setItem('schedule',JSON.stringify(data));

	var df = document.createDocumentFragment();
	var now = Date.current(),
		ntz = -60*now.getTimezoneOffset(),
		day_from = (new Date(day)).setHours(6,0,0),
		day_ends = (new Date(day)).setHours(30,0,0);
	
	console.log(new Date(day_from), new Date(day_ends));
	
	data.telecastsList.forEach(v=>{
		var tvs = this.attachTelecast(v, now, ntz);
		if(tvs.ends<day_from) return;
		//if(tvs.time<day_from) return;
		if(tvs.time>day_ends) return;
		var li = document.createElement('li'),
			a = document.createElement('a'),
			t = document.createElement('time'),
			s = document.createElement('span');
		var bar = document.createElement('s');
		bar.appendChild(document.createElement('u'));
		a.className = 'tlcbar';
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
}
attachTelecast(json, now, ntz) {
	//json.date.timezone, ntz
	var tvshow = new Tvshow(json);
	//console.log(tvshow.state, tvshow.time, tvshow.name)
	return tvshow;
}
}
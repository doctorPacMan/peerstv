'use strict';
class ModuleSchedule extends AppModule {
_constructor(){
	console.log('ModuleSchedule', this.section);
}
update() {

	var ss = localStorage.getItem('schedule');
	if(ss) return this.onload(JSON.parse(ss));

	var cid = '10338232',
		cid = '10338207',
		day = day ? new Date('04/08/2018') : new Date,
		nxt = new Date(day.getTime() + 86400* 1000),
		day_url = day.format('yyyy-mm-dd'),
		nxt_url = nxt.format('yyyy-mm-dd');

	var apiurl = $App.api.service('tv_guide').location;
	apiurl+= 'schedule.json?channel='+cid+'&dates='+day_url+','+nxt_url;
	console.log('request.schedule', apiurl);
	XHR.request(apiurl, this.onload.bind(this));
}
onload(data) {
	//localStorage.setItem('schedule',JSON.stringify(data));

	var now = Date.current(),
		ntz = -60*now.getTimezoneOffset();
	data.telecastsList.forEach(v=>{
		this.attachTelecast(v, now, ntz)
	});	
}
attachTelecast(json, now, ntz) {
	//json.date.timezone, ntz
	var tvshow = new Tvshow(json);
	if(tvshow.ends<now) tvshow.state = 'PAST';
	else if(tvshow.time<now) tvshow.state = 'LIVE';
	else tvshow.state = 'SOON';
	
	console.log(tvshow.state, tvshow.time, tvshow.name)
}
}
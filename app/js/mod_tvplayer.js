'use strict';
class ModuleTvplayer {
constructor(wrapper) {
	this.cnp = new Tvplayer('tvplayer-container');
	this.cnp.attachEvent('playready',this.onPlayReady.bind(this));
	this.cnp.attachEvent('playstart',this.onPlayStart.bind(this));
	attachEvent('telecast/play',this.onTelecastPlay.bind(this));
	attachEvent('channel/load',this.onChannelLoad.bind(this));
	attachEvent('channel/play',this.onChannelLoad.bind(this));
	//console.log(wrapper, this)
	var wrapper = document.getElementById(wrapper);
	this._N = {node: wrapper};

	this.onViewReady(false);
}
_resize(e) {
	var n = this._N.node,
		w = n.offsetWidth,
		h = n.offsetHeight,
		p = w/h,
		s = 16/10;

	var sw = h * s;
	n.style.right = '360px';
	console.log('RESIZE',p,s,sw);
}
_hover(st) {
	clearTimeout(this._hover_timeout);delete this._hover_timeout;
	if(st) this._hover_timeout = setTimeout(this._hover.bind(this,false),3500);
	if(this._hover_state !== st) this.hover(this._hover_state = st);
}
hover(st) {
	this._N.node.classList[st?'add':'remove']('hover');
	//console.log('HOVER',st);
}
onPlayStart(e){
	//console.log('OPS');
}
onPlayReady(e){
	//var t = this.cnp.currentTime,
	//	d = this.cnp.duration;
	//console.log('OPR',t,d);
	this.onViewReady(this._play_rdy = true);
}
onViewReady(s) {
	if(false===s) {
		this._play_cha = false;
		this._play_tvs = false;
		this._play_src = false;
		this._play_rdy = false;
		return;
	}
	else if(this._play_rdy===false || this._play_cha===false || this._play_tvs===false || this._play_src===false) return;

	var cha = this._play_cha,
		tvs = this._play_tvs,
		t = this.cnp.currentTime,
		d = this.cnp.duration,
		live = d===Infinity,
		live = tvs.state==='LIVE',
		live = this.cnp.live;
	if(live) {
		t = Math.ceil((Date.now() - tvs.time)/1e3);
		d = tvs.ends.getTime() - tvs.time.getTime();
		d = Math.floor(d/1e3);
		this.cnp.livestream(d,t);
	} else {
		this.cnp.livestream(false);
	}
	console.log('VIEWREADY '+(live?'LIVE':'ARCH'));
	this.cnp.title({logo:cha.logoURL,name:cha.title});
	this.cnp.title({desc:tvs.name,time:tvs.time});
	this.cnp.setTimeline(d,t,true);
	//this.cnp.pause(false);
	this.cnp.pause(true);
}
onChannelLoad(e) {
	//console.log(e.type, e.detail);
	this.onViewReady(false);
	
	var cha = $App.getChannel(e.detail.apid),
		source = cha.sources[0];
	this.load(source.src, true);
	this.cnp.title({logo:cha.logoURL,name:cha.title});
	
	this.onViewReady(this._play_cha = cha);
	this.onViewReady(this._play_src = source.src);
	$App.request.current(cha.channelId).then((tvs)=>{
		this.onViewReady(this._play_tvs = tvs);
	});
}
onTelecastPlay(e) {
	//console.log(e.type, e.detail);
	this.onViewReady(false);

	var tvid = e.detail,
		tvs = $App.getTelecast(tvid),
		cha = tvs ? $App.getChannelById(tvs.cnid) : null,
		source = cha.sources[0],
		src = source.src,
		cid = source.contractor;
	this.onViewReady(this._play_cha = cha);
	this.onViewReady(this._play_tvs = tvs);

	if(tvs.state==='LIVE') {
		this.onViewReady(this._play_src = src);
		this.load(src, true);
	} else {
		var locurl = $App.api.medialocator(cid>=0 ? cid : 2);
		locurl += 'sources.json?id='+tvs.id;
		if(cid!=2) XHR.load(locurl,this.rips.bind(this));
		else XHR.request(locurl,this.rips.bind(this));
	}
}
update(tvs) {
	this.cnp.title({desc:tvs.name,time:tvs.time});

	var t = this.cnp.currentTime,
		d = this.cnp.duration,
		live = Infinity===d,
		dd;

	if(live) {
		t = Math.ceil((Date.now() - tvs.time)/1e3);
		d = tvs.ends.getTime() - tvs.time.getTime();
		d = Math.floor(d/1e3);
		dd = this.cnp._video.duration;
	}
	console.log('TIME '+(live?'air ':'rec ')+t+'/'+d,dd);
	console.log('TIME\n'+tvs.time+'\n'+tvs.ends+'\n'+new Date(Date.now()));
	this.cnp.setTimeline(d,t,true);
}
view(id) {
	var tvs = $App.getTelecast(id),
		cha = tvs ? $App.getChannelById(tvs.cnid) : null,
		cid = cha.sources[0].contractor;
	//return console.log('view',id,tvs,cha);
	if(false) {
		var apiurl = $App.api.service('tv_guide').location;
		apiurl+= 'telecastInfo.json?telecast='+id;
		//console.log('request.telecast', apiurl);
		XHR.request(apiurl,function(data){
			var tvshow = new Tvshow(data.telecastsList[0]);
			console.log('TVS',tvshow);
		});
	};
	
	var locurl = $App.api.medialocator(cid>=0 ? cid : 2);
	locurl += 'sources.json?id='+id;
	
	if(cid!=2) XHR.load(locurl,this.rips.bind(this));
	else XHR.request(locurl,this.rips.bind(this));

}
rips(data) {
	//console.log('SRC',data);
	var source, rips, files = [], src;
	data.replies.forEach(v=>{
		var cid = v.catalogue_item_id;
		v.rips.forEach(r=>{
			r.parts.forEach(p=>{
				files = files.concat(p.locations.map(l=>{return l.uri}));
			});
		});
	});
	//console.log(files);
	src = files.length ? files[0] : null;
	this.load(files.length ? files[0] : null, false);
	this.onViewReady(this._play_src = src);
}
load(src, live) {
	this.cnp.load(src, live);
}
play(src, live) {
	this.cnp.play(src, live);
}
};
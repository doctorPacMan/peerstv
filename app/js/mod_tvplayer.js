'use strict';
class ModuleTvplayer {
constructor(wrapper) {

	this.cnp = new Tvplayer('tvplayer');
	//this.view(123811800);
	//attachEvent('whereami',this.view.bind(this));
}
view(id) {
	//var id = 123820842;
	console.log('view',id);
/*
	var tvs = $App.getTelecastById(id),
		cha = $App.getChannelById(cnid);

	if(false) {
		var apiurl = $App.api.service('tv_guide').location;
		apiurl+= 'telecastInfo.json?telecast='+id;
		//console.log('request.telecast', apiurl);
		XHR.request(apiurl,function(data){
			var tvshow = new Tvshow(data.telecastsList[0]);
			console.log('TVS',tvshow);
		});
	};
	
	var cid = 1,
		locurl = $App.api.medialocator(cid);
	locurl += 'sources.json?id='+id;
	
	if(cid!=2) XHR.load(locurl,this.rips.bind(this));
	else XHR.request(locurl,this.rips.bind(this));
*/
}
rips(data) {
	console.log('SRC',data);
	var source, rips, files = [];
	data.replies.forEach(v=>{
		var cid = v.catalogue_item_id;
		v.rips.forEach(r=>{
			r.parts.forEach(p=>{
				files = files.concat(p.locations.map(l=>{return l.uri}));
			});
		});
	});
	console.log(files);
	this.play(files[0]);
}
load(src) {
	this.cnp.load(src);
}
play(src) {
	this.cnp.play(src);
}
};
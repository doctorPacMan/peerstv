'use strict';
class ModuleTvplayer {
constructor(wrapper) {

	this.cnp = new Tvplayer('tvplayer-container');
	//this.view(123811800);
	//attachEvent('whereami',this.view.bind(this));
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
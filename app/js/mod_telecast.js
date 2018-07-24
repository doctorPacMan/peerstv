'use strict';
class ModuleTelecast extends AppModule {
_constructor(){
	attachEvent('telecast/play',this.onTelecastPlay.bind(this));
	attachEvent('channel/load',this.onChannelLoad.bind(this));
	attachEvent('channel/play',this.onChannelLoad.bind(this));
	var cont = this.section.querySelector('div > div');
	this._N = {
		time: cont.querySelector('h2 > time'),
		image: cont.querySelector('h2 > img'),
		title: cont.querySelector('h2 > strong'),
		descr: cont.querySelector('article')
	}
	this._N.image.onload = function(){this.style.display = null};
	//this.test();
}
test() {

	var s = '{"id":129652620,"title":"Дом-2. Lite 2186-я серия","description":"На глазах миллионов телезрителей уже более десяти лет на телеканале ТНТ строится любовь, создаются семьи и даже рождаются дети. Счастье и утраты, мечты и разочарования, драки и поцелуи, сюрпризы и расставания - здесь всё сокрушительно честно, по-настоящему. Жизнь, как она есть.","date":{"year":2018,"month":6,"day":4,"hour":9,"minute":0,"second":0,"timezone":25200},"duration":4500,"alias":"dom_2_lite","URL":"http://peers.tv/show/tnt/dom_2_lite/129652620/","telecastImages":[{"profile":0,"width":160,"height":120,"location":"http://peers.tv/data/illustrations/ills/2012/05/28/17631/17631212.jpg"},{"profile":1,"width":80,"height":60,"location":"http://peers.tv/data/illustrations/ills/2012/05/28/17631/17631213.jpg"},{"profile":2,"width":400,"height":300,"location":"http://peers.tv/data/illustrations/ills/2012/08/03/18852/18852893.jpg"},{"profile":3,"width":200,"height":150,"location":"http://peers.tv/data/illustrations/ills/2017/05/04/94908/94908631.jpg"}],"channel":{"channelId":10338256},"ageRestriction":16,"time_offset":13,"ad_tags":[10338256,1931818,11493783,258284,351018]}';
	var tvs = new Tvshow(JSON.parse(s));
	
	var item_id = 133803236,//Vesti
		show_id = 597021;
	$App.request.telecastInfo(item_id).then((data)=>{
		console.log(data)
	});

}
onChannelLoad(e) {
	var cha = $App.getChannel(e.detail.apid);
	this.channel = cha;
	//console.log('onChannelLoad', this.hidden, cha);
	//$App.request.current(cha.channelId).then(function(d){});
	$App.request.current(cha.channelId).then((tvs)=>{this.update(tvs)});
	
	if(this.hidden) return;
}
update(tvs) {
	//console.log('telecast', tvs);

	$App.request.telecast(tvs.id);
	//if(!tvs)
	this._N.image.style.display = 'none';
	this._N.title.innerText = tvs ? tvs.name : 'Канал \u00AB'+this.channel.title+'\u00BB';
	this._N.descr.innerText = tvs ? tvs._data.description : this.channel.description;
	this._N.time.innerText = tvs.time.format('dddd, d mmmm h:nn');
	this._N.time.innerText+= ' - '+tvs.ends.format('h:nn');

	if(!tvs || !tvs.image) {
		this._N.image.setAttribute('width',180);
		this._N.image.setAttribute('height',180);
		this._N.image.setAttribute('src',this.channel.logoURL);
	} else {
		this._N.image.setAttribute('width',tvs.image.width);
		this._N.image.setAttribute('height',tvs.image.height);
		this._N.image.setAttribute('src',tvs.image.location);
	}

}
onTelecastPlay(e) {
	var tvid = e.detail,
		tvs = $App.getTelecast(tvid),
		cha = tvs ? $App.getChannelById(tvs.cnid) : null;
	//console.log('onTelecastPlay',tvs);

	this._N.title.innerText = tvs.name;
	this._N.descr.innerText = tvs._data.description;
	this._N.image.setAttribute('width',tvs.image.width);
	this._N.image.setAttribute('height',tvs.image.height);
	this._N.image.setAttribute('src',tvs.image.location);

}
}
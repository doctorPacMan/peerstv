'use strict';
class ModuleTelecast extends AppModule {
_constructor(){
	//attachEvent('telecast/play',this.onTelecastPlay.bind(this));
	var cont = this.section.querySelector('div > div');
	this._N = {
		image: cont.querySelector('h2 > img'),
		title: cont.querySelector('h2 > strong'),
		descr: cont.querySelector('p')
	}
	//this.test();
}
test() {

	var s = '{"id":129652620,"title":"Дом-2. Lite 2186-я серия","description":"На глазах миллионов телезрителей уже более десяти лет на телеканале ТНТ строится любовь, создаются семьи и даже рождаются дети. Счастье и утраты, мечты и разочарования, драки и поцелуи, сюрпризы и расставания - здесь всё сокрушительно честно, по-настоящему. Жизнь, как она есть.","date":{"year":2018,"month":6,"day":4,"hour":9,"minute":0,"second":0,"timezone":25200},"duration":4500,"alias":"dom_2_lite","URL":"http://peers.tv/show/tnt/dom_2_lite/129652620/","telecastImages":[{"profile":0,"width":160,"height":120,"location":"http://peers.tv/data/illustrations/ills/2012/05/28/17631/17631212.jpg"},{"profile":1,"width":80,"height":60,"location":"http://peers.tv/data/illustrations/ills/2012/05/28/17631/17631213.jpg"},{"profile":2,"width":400,"height":300,"location":"http://peers.tv/data/illustrations/ills/2012/08/03/18852/18852893.jpg"},{"profile":3,"width":200,"height":150,"location":"http://peers.tv/data/illustrations/ills/2017/05/04/94908/94908631.jpg"}],"channel":{"channelId":10338256},"ageRestriction":16,"time_offset":13,"ad_tags":[10338256,1931818,11493783,258284,351018]}';
	var tvs = new Tvshow(JSON.parse(s));
	console.log(tvs);
	
	this._N.title.innerText = tvs.name;
	this._N.descr.innerText = tvs._data.description;
	this._N.image.setAttribute('width',tvs.image.width);
	this._N.image.setAttribute('height',tvs.image.height);
	this._N.image.setAttribute('src',tvs.image.location);
}
onTelecastPlay(e) {
	var tvid = e.detail,
		tvs = $App.getTelecast(tvid),
		cha = tvs ? $App.getChannelById(tvs.cnid) : null;
	console.log('onTelecastPlay',tvs);

	this._N.title.innerText = tvs.name;
	this._N.descr.innerText = tvs._data.description;
	this._N.image.setAttribute('width',tvs.image.width);
	this._N.image.setAttribute('height',tvs.image.height);
	this._N.image.setAttribute('src',tvs.image.location);

}
}
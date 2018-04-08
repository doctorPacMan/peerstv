"use strict";
class Tvshow {
constructor(json) {
	var data = Object.assign({},json);
	this._data = data;

	var image = json.telecastImages.find(v=>{return v.profile==2});//400x300
	if(image) this.image = image.location;
	
	this.id = json.id;
	this.name = json.title || 'Untitled';
	this.time = Date.json(json.date);

	if(json.duration) {
		//this.dura = json.duration;
		this.ends = new Date(this.time.getTime() + json.duration*1e3);
	}
	//this._state;
}
set state(st) {
	//'SOON'|'PAST'|'LIVE';
	this._state	= st;
}
get state() {return this._state}
};
"use strict";
class Tvshow {
constructor(json) {
	var data = Object.assign({},json);
	this._data = data;

	this.id = json.id;
	this.name = json.title || 'Untitled';
	this.time = Date.json(json.date);

	if(json.duration) {
		this.ends = new Date(this.time.getTime() + json.duration*1e3);
	}

	if(json.telecastImages) {
		this.image = json.telecastImages.find(v=>{return v.profile==2});//400x300
	}

	if(json.tvShow) {
		console.log('tvShow', json.tvShow.id, json.tvShow.URL);
	}

	var now = Date.current();
	if(this.ends<now) this.state = 'PAST';
	else if(this.time<now) this.state = 'LIVE';
	else this.state = 'SOON';
}
set state(st) {this._state = st}
get state() {return this._state}
};
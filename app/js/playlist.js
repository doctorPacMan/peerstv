"use strict";
var playlistLoader = function() {return this.initialize.apply(this,arguments)};
playlistLoader.prototype = {
	TRACE: false,
	CACHE: true,
	initialize: function(callback, onerror) {

		this._storage = window.database.storage('channels');
		
		if(!this.CACHE) this._request(callback, onerror);
		else this._storage.getAll(function(channels) {
			if(channels.length>0) callback(channels);
			else this._request(callback, onerror);
		}.bind(this));
	},
	_request: function(callback, onerror) {

		var whereami = $App.api,
			contractorId = whereami.contractor().contractorId,
			appterritory = whereami.territory(),
			serviceUserdata = whereami.service('user_data'),
			serviceTvguide = whereami.service('tv_guide'),
			serviceIptv = whereami.iptv();

		this._apiurl = whereami.host;
		this._callback = callback;
		this._onerror = onerror;
		this._territories = [].concat(whereami.territories || []);
		this._territoryId = appterritory.territoryId;
		this._territoryTz = appterritory.timezone;
		this._contractorId = contractorId;
		this._playlist;
		this._userdata = {};
		this._tvguide = serviceTvguide.location;
		this._favorite = null;
		this._channels = null;
		this._sources = {};
		this._xtimer = new Date();

		var playlists = {};
		serviceIptv.forEach(function(g){
			playlists[g.cid] = {cid:g.cid, src:g.src, data:null};
		});
		
		playlists = this._prov_playlist(playlists, 0);
		//playlists = this._extra_playlist(playlists,1549);
		setTimeout(this._load_playlists.bind(this,playlists),12);
		setTimeout(this._load_favorites.bind(this,serviceUserdata.location),12);

	},
	_prov_playlist: function(playlists, contractorId) {
		var cid = contractorId>=0 ?  contractorId : this._contractorId,
			src = '/data/playlist.m3u8';
		playlists[cid] = {cid:cid, src:src, data:null};
		console.warn('additional playlist ('+src+')');
		return (playlists);
	},
	_extra_playlist: function(playlists, contractorId) {
		var extra = localStorage.getItem('ptv.extraM3U'),
			alpha = localStorage.getItem('ptv.alphaM3U'),
			item = {cid:contractorId, src:extra, data:null};

		if(extra===null) return playlists;
		else if(alpha) playlists = {};
		playlists[contractorId] = item;
		console.warn((alpha?'overwrite':'additional')+' playlist ('+extra+')');
		return (playlists);
	},
	_load_playlists: function(playlists) {

		var handler = function(cid, data){
			if(data) {
				playlists[cid].playlist = new playlistM3U8(data);
				this.trace('respond:', cid, playlists[cid].playlist.playitems().length);
			} else this.trace('respond:', cid, data===false ? 'ERROR' : data);
			var complete = true;playlists[cid].data = data;
			for(var c in playlists) if(null===playlists[c].data) complete = false;
			if(complete) this._onload_playlists(playlists);
		};
		for(var cid in playlists) {
			//this.trace('request:', cid, playlists[cid].src);
			//this.ajax(playlists[cid].src, handler.bind(this,cid), undefined, cid);
		}
		for(var cid in playlists) {
			this.trace('request:', cid, playlists[cid].src);
			XHR.playlist(cid, playlists[cid].src, handler.bind(this,cid));
		}
	},
	_onload_playlists: function(playlists) {

		var channelsSrc = {},
			channelsIds = {},
			channelsAll = [],
			territories = [],
			contractors = Object.keys(playlists),
			channelsByTitle = [];

		contractors = contractors.map(c=>parseInt(c,10));
		contractors.sort((a,b)=>{return b==this._contractorId ? 1 : 0});
		contractors.sort((a,b)=>{return b==2 ? 1 : 0});

		for(var k=0; k<contractors.length; k++) {
			let cid = contractors[k];
			if(false === playlists[cid].data) {console.warn('Loading failure',playlists[cid]);continue}
		
			let playitems = playlists[cid].playlist.playitems();
			if(!playitems.length) this.onReadingError(playlists[cid]);
			else playitems.forEach(function(v){

				var cnid = v.cnid;
				v['contractor'] = parseInt(cid,10);

				if(v.territory)
					if(territories.indexOf(v.territory)<0) territories.push(v.territory);

				if(!cnid) return channelsByTitle.push(v);

				if(channelsAll.indexOf(cnid)<0) channelsAll.push(cnid);
				if(!channelsSrc[cnid]) channelsSrc[cnid] = [v];
				else channelsSrc[cnid].push(v);
			
			}.bind(this));
		}
		
		this._sources = channelsSrc;
		//console.log('playlists channels by cnid: '+channelsAll.length+' by name: '+channelsByTitle.length);
		//console.log(this._sources);
		//console.log('territories', territories);
		this._load_territories(territories,function(channelsAll,channelsByTitle){
			if(!channelsByTitle.length) this._load_channels(channelsAll);
			else this._load_idbytitle(channelsAll, channelsByTitle);
		}.bind(this,channelsAll,channelsByTitle));
	},
	_load_territories: function(tids,callback) {
		this._territories.forEach(t=>{
			var ct = tids.indexOf(t.territoryId);
			if(ct>=0) tids.splice(ct,1);
		});

		if(!tids.length) return callback();

		var apiurl = this._apiurl+'/registry/2/territories.json?id='+tids.join(',');
		this.trace('territory:',tids.join(', '));
		XHR.load(apiurl,function(data){
				//console.log(data);
				if(!data || !data.territories.length) return callback();
				this._territories = this._territories.concat(data.territories);
				//console.log(this._territories);
				callback();
			}.bind(this));
		
	},
	_load_idbytitle: function(channelsAll, playitems) {
		var apiurl = this._tvguide + 'idbytitle.json',
			titles = playitems.map(v => {return v.name}),
			postBody = JSON.stringify({'titles':titles}),
			callback = this._onload_idbytitle.bind(this,channelsAll,playitems);
		XHR.load(apiurl,callback,postBody);
	},
	_onload_idbytitle: function(channelsAll, playitems, data) {
		var channels = data ? data.channels : [];
		for(var p, v, cnid, name, i=0; i<channels.length; i++) {
			p = playitems[i];
			v = channels[i].channelId ? channels[i] : null;
			cnid = !v ? undefined : v.channelId.toString();
			name = !v ? undefined : v.title.toString();
			//this.trace('idbytitle:','"'+p.name+'"', cnid, p.src);
			if(cnid) {
				p['cnid'] = cnid;
				p['name'] = name;
				if(channelsAll.indexOf(cnid)<0) channelsAll.push(cnid);
				if(!this._sources[cnid]) this._sources[cnid] = [p];
				else this._sources[cnid].push(p);
			} else delete p.cnid;
		}
		this._load_channels(channelsAll);
	},
	_load_favorites: function(usdapiurl) {
		//return this.onComplete();
		var apiurl = usdapiurl+'favourites/tv/channels/?method=list&format=json',
			handler = function(data, xhr) {
				if(data===false || !data.elements) this._favorite = [];
				else this._favorite = data.elements.map(function(v){return v.id});
				this.trace('favourite:',this._favorite.join(', '));
				this.onComplete();
			}.bind(this);
		XHR.request(apiurl, handler);
	},
	_load_channels: function(channelsList) {
		var apiurl = this._tvguide,
			fields = 'alias,title,logoURL,hasSchedule';
		apiurl += 'channels.json?t='+this._territoryId;
		apiurl += '&fields='+fields;
		apiurl += '&channel='+channelsList.join(',');
		XHR.load(apiurl,function(data,xhr){
			this._channels = [];
			if(data) data.channels.forEach(json=>{
				var cnid = json.channelId.toString(),
					position = 1 + channelsList.indexOf(cnid);
				this.pushChannel(cnid, position, json);
			});
			this.onComplete();
		}.bind(this));

	},
	pushChannel: function(cnid, position, json) {
		var data = Object.assign({
				apid: json.alias || ('cn'+this._channels.length),
				position: position,
				sources: this._sources[cnid]
			},json);

		data.channelId = cnid;

		data.sources.forEach(s=>this.setSourceWeight(s));
		data.sources.sort((a,b)=>{return b.weight - a.weight});

		var src = data.sources[0];
		if(src.contractor!=2 && src.locked) {}// skip locked
		else if(json.hasSchedule) this._channels.push(data);

		return data;
	},
	getChannelById: function(cnid) {
		var dc = this._channels.find(v=>{return v.channelId===cnid});
		return dc;
	},
	setSourceWeight: function(source) {
		//console.log('setweight:',source);
		var cid = source.contractor,
			ctz = parseInt(this._territoryTz/60, 10),
			embedtype = (source.type === 'embed'),
			homegrown = (cid == this._contractorId),
			paidAllow = (!!source.paid && !source.locked),
			weight = 0;
	
		if(paidAllow) weight += 12;
		if(homegrown) weight += 10;
		if(embedtype) weight += 8;

		var tid = source.territory,
			ter = this._territories.find(t=>{return t.territoryId===source.territory}) || {},
			stz = parseInt(ter.timezone,10)/60,
			distance = isNaN(stz) ? 1 : Math.abs(ctz - stz)/72/10,
			tzfactor = distance>=1 ? .999 : (distance<=0 ? .001 : distance),
			tzfactor = Math.round((1 - tzfactor)*1e3)/1e3;
		weight += tzfactor;

		var trace = 'paidAllow:'+paidAllow+' homegrown:'+homegrown+' ('+this._contractorId+'/'+cid+')';
		trace += '\nterritory:'+tzfactor+' '+ter.name;
		trace += '\nweight:'+weight;
		
		//if(source.cnid=='65667067') {console.log(source);console.log(trace)};
		source['weight'] = weight;
		return source;
	},
	onComplete: function(channels) {
		if(this._favorite===null || this._channels===null) return;
		if(this._favorite.length)
			for(var i=0, cnid, v; i<this._channels.length; i++) {
				v = this._channels[i];
				if(this._favorite.indexOf(v.channelId)<0) continue;
				else this._channels[i]['is_favourite'] = true;
				//console.log('favourite', v);
			}
		
		var time = Date.now() - this._xtimer.getTime();
		console.log('completed:', time+'ms.', this._channels.length+' items');
		delete this._xtimer;

if(false) {
console.log(this.getChannelById('65667067').sources);//DOGM
console.log(this.getChannelById('23643734').sources);//OTP
console.log(this.getChannelById('28036134').sources);//PBY
}
//console.log('fill',this._channels);
		if(this.CACHE) this._storage.fill(this._channels,function(success, count){
				console.log('save '+count+' items');
				this._callback(this._channels);
			}.bind(this));
		else this._callback(this._channels);
	},
	onLoadingError: function(cid, url, e) {
		if(e.type=='load' && e.target.status==200) return;
		//else if(e.type=='error') console.log(e);
		var xhr = e.target,
			code = e.type=='timeout' ? 13 : 12;
		if(this._onerror) this._onerror(code,cid,url,xhr);
	},
	onReadingError: function(playlist) {
		if(this._onerror) this._onerror(14,playlist.cid,playlist.src);
	},
	trace: function() {
		if(!this.TRACE) return;
		var args = Array.from(arguments),
			text = args.shift();
		args.unshift('color: olive;font-weight:bold');
		args.unshift('%c'+text);
		console.log.apply(console, args);
	}
};
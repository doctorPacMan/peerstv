"use strict";
if(!window.cnapi) window.cnapi = {request:{},provider:{conf:{}}};
cnapi.request.playlist = function(callback, onerror) {return new this.playlistLoader(callback, onerror)};
cnapi.request.playlistLoader = function() {return this.initialize.apply(this,arguments)};
cnapi.request.playlistLoader.prototype = {
	TRACE: false,
	ajax: function(url, onComplete, postBody, cid) {

		var postBody = postBody!==undefined ? postBody : null,
			token = cnapi ? cnapi.provider.getAuthToken() : null,
			playlist_request = (cid!==undefined),
			xhr = new XMLHttpRequest();

		// Inetra playlist cache buster
		if(playlist_request && cid==2) {
			let vu = new URL(url);
			vu.searchParams.set('cb',Date.now());
			url = vu.href;
		}

		xhr.open(postBody?'POST':'GET', url, true);
		if(!playlist_request) {
			if(postBody) xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
			if(token) xhr.setRequestHeader('Authorization','Bearer ' + token);
		} else {
			if(cid==2) {
				let capabilities = 'paid_content,adult_content';
				if(window.Bytefog) capabilities += ',bytefog';
				xhr.setRequestHeader('Client-Capabilities',capabilities);
				if(token) xhr.setRequestHeader('Authorization','Bearer ' + token);
			}
			xhr.addEventListener('timeout', this.onLoadingError.bind(this,cid,url));
			xhr.addEventListener('error', this.onLoadingError.bind(this,cid,url));
			xhr.addEventListener('load', this.onLoadingError.bind(this,cid,url));
			xhr.timeout = 15000;
		}

		xhr.onreadystatechange = function(){
			if (xhr.readyState != 4) return;
			else if(xhr.status != 200) onComplete(false,xhr);
			else {
				var json, text = xhr.responseText;
			    if(/^(?:\{|\[|\")/.test(text))
				    try {json = JSON.parse(xhr.responseText)}
				    catch(e) {console.log('JPError',e,text)};
				onComplete(json || text, xhr);
			}
		};
		return xhr.send(postBody);
	},
	initialize: function(callback, onerror) {
		var whereami = cnapi.whereami;
		if(!whereami) {
			whereami = window.whereami.data;
			whereami.host = window.whereami.host;
			cnapi.provider = {getAuthToken:window.whereami.token.bind(window.whereami)};
		}

		var contractorId = whereami.contractor ? whereami.contractor.contractorId : undefined,
			serviceUserdata = whereami.services.filter(function(s){return s.type=='user_data'}),
			serviceTvguide = whereami.services.filter(function(s){return s.type=='tv_guide'}),
			serviceIptv = whereami.services.filter(function(s){return s.type=='iptv'}),
			territories = Array.from(whereami.territories || []),
			territory = Object.assign({},territories[0]);

		this._apiurl = '//'+whereami.host;
		this._callback = callback;
		this._onerror = onerror;
		this._territories = territories;
		this._territoryId = territory.territoryId;
		this._territoryTz = territory.timezone;
		this._contractorId = contractorId;
		this._playlist;
		this._userdata = {};
		this._tvguide = null;
		this._favorite = null;
		this._channels = null;
		this._sources = {};
		this._xtimer = new Date();

		var userdata = {}, usdapiurl;
		serviceUserdata.forEach(function(g){
			var cid = g.contractor.contractorId,
				apv = g.apiVersions.length ? g.apiVersions[g.apiVersions.length-1] : null;
			userdata[cid] = null===apv ? undefined : apv.location;
		});
		if(userdata[contractorId]) usdapiurl = userdata[contractorId];
		else if(userdata[2]) usdapiurl = userdata[2];
		else usdapiurl = userdata[Object.keys(userdata)[0]];

		var tvguides = {};
		serviceTvguide.forEach(function(g){
			var cid = g.contractor.contractorId,
				apv = g.apiVersions.length ? g.apiVersions[g.apiVersions.length-1] : null,
				src = null===apv ? undefined : apv.location;
			tvguides[cid] = src;
		});
		if(tvguides[contractorId]) this._tvguide = tvguides[contractorId];
		else if(tvguides[2]) this._tvguide = tvguides[2];
		else this._tvguide = tvguides[Object.keys(tvguides)[0]];
		//this._tvguide = tvguides;

		var playlists = {};
		serviceIptv.forEach(function(g){
			var cid = g.contractor.contractorId,
				apv = g.apiVersions.length ? g.apiVersions[g.apiVersions.length-1] : null,
				src = null===apv ? undefined : apv.location;
			playlists[cid] = {cid:cid,src:src,data:null};
		});
		
		//playlists = this._prov_playlist(playlists,0);
		playlists = this._extra_playlist(playlists,1549);
		setTimeout(this._load_playlists.bind(this,playlists),12);
		setTimeout(this._load_favorites.bind(this,usdapiurl),12);
	},
	_prov_playlist: function(playlists, contractorId) {
		var cid = contractorId>=0 ?  contractorId : this._contractorId,
			src = '//a.cha.ptv.bender.inetra.ru/data/bad.m3u';
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
			this.trace('request:', cid, playlists[cid].src);
			this.ajax(playlists[cid].src, handler.bind(this,cid), undefined, cid);
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

		if(!tids.length) callback();
		else {
			var apiurl = ''+this._apiurl+'/registry/2/territories.json?id='+tids.join(',');
			this.trace('territory:',tids.join(', '));
			this.ajax(apiurl,function(data){
				//console.log(data);
				if(!data || !data.territories.length) return callback();
				this._territories = this._territories.concat(data.territories);
				//console.log(this._territories);
				callback();
			}.bind(this));
		}
	},
	_load_idbytitle: function(channelsAll, playitems) {
		var apiurl = this._tvguide + 'idbytitle.json',
			titles = playitems.map(v => {return v.name}),
			postBody = JSON.stringify({'titles':titles}),
			callback = this._onload_idbytitle.bind(this,channelsAll,playitems);
		this.ajax(apiurl,callback,postBody);
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
		var apiurl = usdapiurl+'favourites/tv/channels/?method=list&format=json',
			handler = function(data, xhr) {
				if(data===false || !data.elements) this._favorite = [];
				else this._favorite = data.elements.map(function(v){return v.id});
				this.trace('favourite:',this._favorite.join(', '));
				this.onComplete();
			}.bind(this);
		this.ajax(apiurl, handler, {});
	},
	_load_channels: function(channelsList) {
		var apiurl = this._tvguide,
			fields = 'alias,title,hasSchedule,description,info,logoURL';
		apiurl += 'channels.json?t='+this._territoryId;
		apiurl += '&fields='+fields;
		apiurl += '&channel='+channelsList.join(',');
		var pushChannel = this.pushChannel.bind(this);
		this.ajax(apiurl,function(data,xhr){
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
		data.sources.forEach(s=>this.setSourceWeight(s));// set weight & timezone
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
		var cid = source.contractor,
			ctz = parseInt(this._territoryTz,10),
			embedtype = (source.type === 'embed'),
			p2psource = (source.type === 'p2p'),
			homegrown = (cid == this._contractorId),
			paidAllow = (!!source.paid && !source.locked),
			tzfactor = 0,
			weight = 1;
	
		if(paidAllow) weight += 12;
		if(homegrown) weight += 10;
		if(embedtype) weight += 8;
		if(p2psource) weight += 1;

		var tid = source.territory,
			ter = this._territories.find(t=>{return t.territoryId===source.territory}) || {},
			ttz = parseInt(ter.timezone,10);
		
		if(!isNaN(ctz)) {
			let distance = isNaN(ttz) ? 1 : Math.abs((ctz - ttz)/60)/72/10;
			tzfactor = distance>=1 ? .999 : (distance<=0 ? .001 : distance);
			tzfactor = Math.round((1 - tzfactor)*1e3)/1e3;
			weight += tzfactor;
		}

		var trace = 'paidAllow:'+paidAllow+' homegrown:'+homegrown+' ('+this._contractorId+'/'+cid+')';
		trace += '\nterritory: '+ter.name+' ('+tzfactor+')';
		trace += '\nweight:'+weight;
		source['weight'] = weight;
		if(!isNaN(ttz)) source['timezone'] = ttz;
		//if(source.cnid=='10338257') {console.log(source);console.log(trace)};
		//if(source.cnid=='10338258') {console.log(source);console.log(trace)};		
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

//console.log(this.getChannelById('65667067').sources);//DOGM
//console.log(this.getChannelById('23643734').sources);//OTP
//console.log(this.getChannelById('28036134').sources);//PBY
		
		if(typeof this._callback === 'function') this._callback(this._channels);
		else console.log(this._channels);
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
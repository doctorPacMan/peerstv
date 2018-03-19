"use strict";
var cnapi = {
	API_HOST: 'http://api.peers.tv',
	API_CLIENT: 'demoapp',
	API_SECRET: 'demoapp',
	//API_HOST: 'http://a.trunk.ptv.bender.inetra.ru',
	//API_CLIENT: '83438335',
	//API_SECRET: '96ac1ee9b626a5a0a3a147518232d2f5',
	//WRM_URL: '/data/whereami.json',
	_data: {},
	token: null,
	request: {},
	location: null,
	provider: null,
	whereami: null,
	initialize: function(callback, monitor, simple) {

		this._onready = callback;
		this._monitor = monitor.progress.bind(monitor);
		this._simple = simple===true;

		this._monitor('whereami',null);
		var jwd = localStorage.getItem('json_whereami');
		if(jwd && false) this._handler_whereami(JSON.parse(jwd));
		else {
			var wrmurl = this.API_HOST+'/registry/2/whereami.json';
			if(this.WRM_URL) console.info('Whereami override', wrmurl = this.WRM_URL);
			$Ajax(wrmurl, this._handler_whereami.bind(this), null, true);
		}
	},
	_handler_whereami: function(data, xhr) {

		//console.log('Whereami', data);
		if(data===false) return this._monitor('whereami',false);
		else this._monitor('whereami',true);
		localStorage.setItem('json_whereami',JSON.stringify(data));
		this.whereami = data;

		var terr = data.territories[0];
		this.teritory = terr;
		this.location = !terr ? '0' : terr.territoryId;

		var whrmdate = !xhr ? false : xhr.getResponseHeader('Date');
		if(whrmdate) Date.server(whrmdate);
		else if(terr && terr.timezone) {
			var dt = new Date(),
				dtz = dt.getTimezoneOffset() + terr.timezone/60;
			Date.server(dt.setMinutes(dt.getMinutes() + dtz));
		}
		if(DEBUG) console.log('Whereami datetime', new Date.server());
		//var dc = new Date(), ds = new Date.server();
		//console.log('client '+dc.getTime()+' '+dc+'\nserver '+ds.getTime()+' '+ds);

		var provider = null;
		if(data.contractor) {
			var provider = {
				id: data.contractor.contractorId,
				name: data.contractor.name
			};
			if(data.contractor.images) data.contractor.images.forEach(function(v){if(v.profile==1)provider.logo=v.URL});
		}
		this.provider = provider;
		if(DEBUG) console.log('Whereami provider', this.provider);

		var playlists = {}, mlocators = {}, apislist = {};
		data.services.forEach(function(v){
			var uri = !v.apiVersions.length ? null : v.apiVersions[v.apiVersions.length-1].location,
				pid = !v.contractor ? 0 : v.contractor.contractorId;
			if(v.type=='auth') apislist.auth = uri;
			if(v.type=='tv_guide') apislist.tvguide = uri;
			if(v.type=='media_locator') mlocators[pid] = uri;
			if(v.type=='iptv') playlists[pid] = uri;
		});
		//playlists = {'x':HOST+'/data/playlist.xspf'};
		//playlists['x'] = HOST+'/data/playlist.xspf';
		this._temp_playlists = playlists;
		this.apis = apislist;
		this.apis.medialocator = mlocators;

		if(DEBUG) {
			console.log('Whereami apislist', apislist);
			console.log('Whereami playlist', playlists);
			console.log('Whereami mlocator', mlocators);
		}

		//this.setAuthToken('cd4e5a6bee96fec8b50e9831cdac2572');
		if(this.token = this.getAuthToken()) {
			if(DEBUG) console.log('Authtoken restore', this.token);
			this._monitor('authtoken',true);
			if(!this._simple) this._request_playlists();
			else {
				this._monitor('playlist',true);
				this._monitor('channels',true);
				this._onready();
			}
		}
		else {
			var srcurl = this.apis.auth+'token/',
				params = {
					//'grant_type': 'inetra:anonymous',
					'grant_type': 'inetra:anonymous',
					'client_secret':this.API_SECRET,
					'client_id':this.API_CLIENT
				};
			console.log(srcurl, params);
			$Ajax(srcurl,this._handler_acstoken.bind(this),params);
			this._monitor('authtoken',null);
		}
	},
	_handler_acstoken: function(data) {
		//console.log('TOKEN',data);
		if(data===false) {
			console.warn('Authtoken request failure');
			this._monitor('authtoken',false);
			return this.delAuthToken();
		} this._monitor('authtoken',true);
		
		var token = data.access_token,
			renew = data.refresh_token,
			expin = parseInt(data.expires_in, 10),
			expdt = Date.now() + expin*1e3,
			expdt = new Date(expdt).format('yyyy/mm/dd h:nn:ss');
		
		this.setAuthToken(token, expdt, renew);
		console.log('Authtoken set new', this.token);
		this._request_playlists();
	},
	_request_playlists: function() {
		var playlists = this._temp_playlists;
		delete this._temp_playlists;

		this._monitor('playlist',null);
		
		var progress = {},
			channels = new ChannelsPlaylist(),
			loadinfo = this._request_channels.bind(this),
			complete = function(pl) {
				for(var pid in pl) channels.push(pid, pl[pid]);
				loadinfo(channels);
			},
			callback = function(pid,src){return function(data,xhr){
				var done = true; progress[pid] = data;
				for(var s in progress) if(progress[s]===undefined) done = false;
				if(done) complete(progress);
			}};
		for(var pid in playlists) {
			progress[pid] = undefined;
			$Ajax(playlists[pid], callback(pid,playlists[pid]), null, true);
		}
	},
	_request_channels: function(playlist){
		this._monitor('playlist',true).progress('channels',0);
		//console.log(playlist);
		var onload = this._handler_channels.bind(this,playlist);
		this.request.channels(playlist.cids.join(','),onload);
	},
	_handler_channels: function(playlist, channels) {
		//console.log('playlist',playlist);
		//console.log('channels',channels);
		//console.log(playlist.cids.length, channels.length);

		var missed = [].concat(playlist.cids);
		for(var j=0; j<channels.length; j++) {
			var json = channels[j],
				cid = json.channelId.toString(),
				data = playlist.channels[cid];

			if(!json.hasSchedule) {
				console.warn('!schedule', json.channelId, json.title);
				continue;
			}
			
			playlist.channels[cid] = new TvChannel(data, json);

			var n = missed.indexOf(cid);
			if(n>-1) missed.splice(n,1);
		}
	
		for(var j=0, titles = []; j<missed.length; j++) {
			var cid = missed[j],
				data = playlist.channels[cid];
			playlist.channels[cid] = new TvChannel(data);
			//console.log('Missed channel:', cid, playlist.channels[cid]);
		}
		//cnapi.request.idbytitle(titles, this._handler_idbytitle.bind(this,playlist));
		this._monitor('channels',true);
		this._onready(playlist);
	},
	//_handler_idbytitle: function(playlist, data) {console.log(data)},
	setAuthToken: function(token, expdt, refresh) {

		//console.log('setAuthToken', token, expdt, refresh);

		if(!expdt) {
			expdt = Date.now() + 86400*1e3,// 24h
			expdt = new Date(expdt).format('yyyy/mm/dd h:nn:ss');
		}

		cookie.set('token', token, expdt);
		localStorage.setItem('token',token);
		localStorage.setItem('token_expires',expdt);

		if(refresh && false) {
			var expre = Date.now() + 86400*7*1e3;// 7 days
				expre = new Date(expre).format('yyyy/mm/dd h:nn:ss');
			cookie.set('refresh', refresh, expre);
			localStorage.setItem('token_refresh',refresh);
		}
		return this.token = this.getAuthToken();
	},
	delAuthToken: function() {
		cookie.set('token', '0', new Date('1970/1/1'));
		localStorage.removeItem('token');
		localStorage.removeItem('token_expires');
		delete this.token;
		return null;
	},
	getAuthToken: function() {
		
		if(this.token) return this.token;

		var val = localStorage.getItem('token'),
			exp = localStorage.getItem('token_expires');
		if(!val || !exp || val==='undefined') return null;
		
		var old = new Date(exp) - Date.now(),
			lifetime = Math.round(old/1000/60),
			obsolete = old<0,
			token = obsolete ? null : val;

		if(obsolete) {
			localStorage.removeItem('token');
			localStorage.removeItem('token_expires');
		}
		//console.log('getAuthToken', val, exp, obsolete, lifetime+'m');
		return token;
	}
}
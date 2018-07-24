// http://api.peers.tv/doc/m3u-extending.html
var playlistM3U8 = function(text) {

	this._length = 0;
	this._playitems = [];
	
	if(typeof(text)!='string') console.log('Incorrect playlist data');
	else if('#EXTM3U'!==text.substring(0,7)) console.log('Incorrect playlist data',text);
	else this.parse(text);

	return {
		//length: this.length.bind(this),
		playitems: this.playitems.bind(this)
	}
};
playlistM3U8.prototype = {
	_regexp_extinf_dura: new RegExp('#EXTINF:([+-]?[0-9]*[\.]?[0-9]+)'),
	_regexp_extinf_cnid: new RegExp('cn-id=([0-9]+)'),
	_regexp_extinf_group: new RegExp('group-title="(.+)"'),
	_regexp_embed_source: new RegExp('^embed:\\?url=([^&]+)'),
	_regexp_hls_location: new RegExp('^http(s?)://([a-z0-9./_-])+.m3u(8?)(\\?|$)'),
	_regexp_quotesremove: new RegExp('^"(.*)"$'),
	_parseLineExt: function(extline) {
		var line = extline.trim(),
			attr = line.split(' '),
			data = {_:line};

		attr.forEach(function(v){
			var sa = v.split('='),
				sn = sa[0],
				sv = sa[1] || undefined;
			if(sv==='false') sv = false; else if(sv==='true') sv = true;
			else sv = sv.replace(this._regexp_quotesremove,'$1');
			data[sn] = sv;
		});
		return data;
	},
	_parseLineExtinf: function(extline) {

		var extinf = {},
			line = extline.trim(),
			info, dura, title, cnid, group;

		extinf['_'] = line;
		line = line.split(',');
		info = line[0];

		//get title
		extinf['title'] = !line[1] ? undefined : line[1].trim();

		// get duration
		//dura = this._regexp_extinf_dura.exec(info);
		//dura = !dura ? undefined : parseFloat(dura[1]);
		//extinf['duration'] = isNaN(dura) ? undefined : (dura===-1 ? Infinity : dura);

		// get group-title
		group = this._regexp_extinf_group.exec(info);
		if(group && group[1]) extinf['group'] = group[1];

		// get cn-id
		cnid = this._regexp_extinf_cnid.exec(info);
		extinf['cnid'] = !cnid ? undefined : cnid[1];
			
		// get cn-records
		if(info.indexOf('cn-records=1')>=0) extinf['recordable'] = true;

		return extinf;
	},
	_parseLineLocation: function(line) {

		var line = line.trim(),
			valid = true;

		if(!line.length) valid = false;
		else if(!this._regexp_hls_location.test(line)) {
			console.log('invalid location', line);
			valid = false;
		} else {}

		return !valid ? false : line;
	},
	_parseMagnetSource: function(source) {
		var md = decodeURIComponent(source),
			mv = md.replace('magnet:?xt=urn:','');
		//console.log('P2P',decodeURIComponent(mv));
		return source;
	},
	_parseEmbedSource: function(source) {
		var rs = this._regexp_embed_source.exec(source);
		if(rs && rs[1]) return decodeURIComponent(rs[1]);
		else return source;
	},
	parse: function(playlistText) {
		var lines = [],
			data = playlistText.trim(),
			data = data;
		//console.log(data.substring(0,360)+' ...');
		data = data.replace(new RegExp('\r\n','gi'),'\n');
		data = data.replace(new RegExp('\n{2,3}','gi'),'\n');
		data = data.replace(/#EXTM3U\n/,'');
		lines = data.split('\n');

		//console.log(lines.join('\n'));

		var key=0, source = null, extinf = null, extras = {},
			pi, ln, xn, xv, playitem, playitems = [];
		while(ln = lines.shift()) {
			if(!ln.length) continue;
			else if(ln[0]=='#' && ln.substring(0,4)!='#EXT') continue;
			else if(ln.substring(0,8)=='#EXTINF:') {
				extinf = this._parseLineExtinf(ln);
			}
			else if(ln.substring(0,5)=='#EXT-') {
				xn = ln.slice(5,ln.indexOf(':'));
				xv = ln.substring(1 + ln.indexOf(':'));
				extras[xn.toLowerCase()] = this._parseLineExt(xv);
			}
			else {
				this.cumulatePlayitem(ln, extinf, extras);
				pi = source = extinf = null;
				extras = {};
				key++;
			};
		};
		//console.log(playitems);
		return playitems;
	},
	length: function() {
		return this._playitems.length;
	},
	playitems: function(cnid) {
		return this._playitems;
	},
	cumulatePlayitem: function(src, extinf, ext) {

		var extinf = extinf || {},
			inetraCI = !ext ? {} : (ext['inetra-channel-inf'] || {}),
			inetraSI = !ext ? {} : (ext['inetra-stream-inf'] || {}),
			recordable = extinf.recordable || true===inetraCI['recordable'],
			name = extinf.title ? extinf.title.toString() : undefined,
			cnid = extinf.cnid ? extinf.cnid.toString() : undefined,
			source = src.trim(),
			type = 'hls';

		if(!cnid && !name) return;// console.log(src);
		if(source.indexOf('udp:')==0) return type = 'udp'; // skip UDP
		else if(source.indexOf('magnet:')==0) {
			source = this._parseMagnetSource(source);
			type = 'p2p';
		}
		else if(source.indexOf('embed:')==0) {
			source = this._parseEmbedSource(source);
			type = 'embed';
		}
		else {//if(!this._parseLineLocation(source)) return;// HLS only
		}

		var playitem = {
			type: type,
			cnid: cnid,
			name: extinf.title,
			src: source,
			extinf: extinf,
			ext: ext
		};
		
		//if(inetraCI['channel-id']) playitem.cnid = inetraCI['channel-id'];
		if(inetraCI['recordable']===true || extinf.recordable) playitem.recordable = true;
		if(inetraSI['ad-targeting']) playitem.ad_targeting = true;
		if(inetraCI['territory-id']) {
			let tid = parseInt(inetraCI['territory-id'],10);
			if(!isNaN(tid)) playitem.territory = tid;
		}

		if(inetraSI['access']) {
			let access = inetraSI['access'].replace(/^"(.*)"$/,'$1');
			playitem.access = access;
			if(access!='allowed') {//purchased|denied|pending
				playitem.paid = true;
				playitem.locked = (access!='purchased');
				//console.log(cnid, access, playitem);
			}
			//console.warn('access: "'+access+'"');
		}
		if(inetraSI['allowed-till']) {
			let till = inetraSI['allowed-till'].replace(/^"(.*)"$/,'$1');
			playitem.allowed = till;
			//console.warn('allowed-till',playitem);
		}
		if(inetraSI['pending-till']) {
			let till = inetraSI['pending-till'].replace(/^"(.*)"$/,'$1');
			playitem.pending = till;
			//console.warn('pending-till',playitem);			
		}
		
		//console.log('cumulatePlayitem', cnid, playitem);
		this._playitems.push(playitem);
		return playitem;
	}
};
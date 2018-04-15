Object.assign($App,{router:{
initialize: function(){
	//console.log('ROUTER');
	window.addEventListener('hashchange',this.hashchange.bind(this),false);
	this.hashchange();
},
location: function(apid) {
	window.location.hash = '!/'+apid+'/';
},
hashchange: function(e) {

	var hash = window.location.hash.replace(/^#/,''),
		hash = ''!==hash ? hash : null,
		params = {};

	if(hash) {
		let s = hash.substring(2).split('/');
		params['_list'] = s;
		params['channel'] = s[0];
	}

	console.log(typeof(hash), '"'+hash+'"', params);
	if(params.channel) $App.loadChannel(params.channel);
	//if(hash==='passport') $App._passport.toggle();
}
}});
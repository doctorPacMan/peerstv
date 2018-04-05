Object.assign($App,{router:{
initialize: function(){
	//console.log('ROUTER');
	window.addEventListener('hashchange',this.hashchange.bind(this),false);
	this.hashchange();
},
hashchange: function(e) {

	var hash = window.location.hash.replace(/^#/,''),
		hash = ''!==hash ? hash : null;
	//console.log(typeof(hash), '"'+hash+'"')
	if(hash==='passport') $App._passport.toggle();
}
}});
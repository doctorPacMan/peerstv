"use strict";
class ModuleChannels {
constructor(section) {
	var section = document.getElementById(section),
		list = section.querySelector('div > ol');

	this._channels = {};
	this._list = list;
	return console.log(section, list);

}
update(playlist) {
	//console.log(playlist);
	var df = document.createDocumentFragment();
	playlist.forEach(cha => {
		var id = cha.channelId,
			li = document.createElement('li'),
			cn = this.channelNode(cha);
		li.appendChild(cn);
		df.appendChild(li);
		this._channels[id] = cha;
		this._channels[id]['node'] = cn;
	});
	this._list.appendChild(df);
}
channelNode(cha) {
	var node = document.createElement('a'),
		logo = document.createElement('img'),
		name = document.createElement('span'),
		star = document.createElement('s');

	node.appendChild(logo);
	node.appendChild(name);
	node.appendChild(star);
	node.setAttribute('href','#'+cha.apid);
	star.addEventListener('click',this.click.bind(this,cha.channelId));
	name.innerText = cha.title || '#'+cha.channelId;
	if(cha.logoURL) logo.setAttribute('src',cha.logoURL);
	if(cha.is_favourite) node.classList.add('starred');
	return node;
}
click(cnid, event) {
	if(event) event.preventDefault();
/*	
	var cha = this._channels[cnid],
		fvr = !!cha.is_favourite;
	console.log(cnid, cha.title, !!cha.is_favourite);
	cha.is_favourite = !cha.is_favourite;
	var storage = window.database.storage('channels'),
		update = {is_favourite:cha.is_favourite};
	storage.update(cnid,update,function(itemNew,itemOut){
		//console.log('out',itemOut);console.log('new',itemNew);
		//console.log('cha',cha);
		cha.node.classList[itemNew.is_favourite?'add':'remove']('starred');
	});
*/
}
};
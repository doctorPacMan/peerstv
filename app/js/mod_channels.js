"use strict";
class ModuleChannels extends AppModule {
_constructor() {
	var list = this.section.querySelector('div > ol');

	this._channels = {};
	this._list = list;
	this._scrl = list.parentNode.parentNode;
	//attachEvent('channel/load',this.onChannelView.bind(this));
	attachEvent('channel/play',this.onChannelPlay.bind(this));
	//return console.log(section, list);
}
update(playlist) {
	//console.log(playlist);
	var df = document.createDocumentFragment();
	playlist.forEach(cha => {
		var id = cha.channelId,
			id = cha.apid,
			li = document.createElement('li'),
			cn = this.channelNode(cha);
		li.appendChild(cn);
		df.appendChild(li);
		this._channels[id] = {};
		this._channels[id]['node'] = cn;
		this._channels[id]['cont'] = li;
		if(id=='sts') console.log(cha);
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
	node.addEventListener('click',this.click.bind(this,cha.channelId));
	//star.addEventListener('click',this.click.bind(this,cha.channelId));
	name.innerText = cha.title || '#'+cha.channelId;
	if(cha.logoURL) logo.setAttribute('src',cha.logoURL);
	if(cha.is_favourite) node.classList.add('starred');
	return node;
}
click(cnid, event) {
	if(event) event.preventDefault();
	$App.playChannel(cnid);
}
onChannelPlay(e) {
	var prev = this._list.querySelector('li.focus');
	if(prev) prev.classList.remove('focus');

	var cha = $App.getChannel(e.detail.apid),
		node = this._channels[cha.apid]['node'],
		cont = node.parentNode;
	cont.classList.add('focus');
	scrollIntoView(cont, this._scrl);
}
};
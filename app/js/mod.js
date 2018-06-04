'use strict';
class AppModule {
constructor(section) {
	var args = Array.from(arguments);
	//this.visible = false;
	this.apid;
	this.section = document.getElementById(args.shift());
	this.hidden = this.section.classList.contains('hddn');
	this.header = this.section.querySelector('h2');
	
	if(this.header) {
		var close = document.createElement('del');
		if (!this.header.firstChild) this.header.appendChild(close);
		else this.header.insertBefore(close,this.header.firstChild);
		close.addEventListener('click',this.toggle.bind(this));
	}
	//this.section.addEventListener('transitionend',this.ontoggle.bind(this),true);
	this._constructor.apply(this, args);
}
toggle(e) {
	var hddn = this.section.classList.contains('hddn');
	this.section.classList[hddn?'remove':'add']('hddn');
	this.hidden = !hddn;
	dispatchEvent('module/toggle',this.apid);
	return this;
}
ontoggle(e) {
	console.log('ontoggle', e);
}
};

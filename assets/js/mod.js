'use strict';
class AppModule {
constructor(section) {
	var args = Array.from(arguments);
	this.section = document.getElementById(args.shift());
	this.header = this.section.querySelector(':scope > h2');

	var close = document.createElement('del');
	if (!this.header.firstChild) this.header.appendChild(close);
	else this.header.insertBefore(close,this.header.firstChild);

	close.addEventListener('click',this.toggle.bind(this));
	this.section.addEventListener('transitionend',this.ontoggle.bind(this),true);

	this._constructor.apply(this, args);
}
toggle(e) {
	var hddn = this.section.classList.contains('hddn');
	this.section.classList[hddn?'remove':'add']('hddn');
}
ontoggle(e) {
	console.log('ontoggle', e);
}
};
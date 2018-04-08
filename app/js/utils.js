'use strict';
function eventEmitter() {
	//var emitter = new EventTarget();
	//var emitter = document.createElement('span');
	var emitter = document.createDocumentFragment();
	window.attachEvent = function(ename,callback) {emitter.addEventListener(ename,callback,false)};
	window.detachEvent = function(ename,callback) {emitter.removeEventListener(ename,callback,false)};
	window.dispatchEvent = function(ename,data) {
		//console.log('<EVENT>',ename);
		var data = data || {'time':Date.now()},
			detail = Object.assign({},data),
			event = new CustomEvent(ename, {detail:detail});
		emitter.dispatchEvent(event);
	};	
	return emitter;
};
function fixScrollbarOffset() {
	var outer = document.createElement('div'),
		inner = document.createElement('div');

	inner.setAttribute('style','width:100%');
	outer.setAttribute('style','visibility:hidden;width:100px');
	outer.style.msOverflowStyle = 'scrollbar'; // for WinJS apps
	document.body.appendChild(outer);
	var notScrollWidth = parseInt(outer.offsetWidth,10);

	outer.style.overflow = 'scroll';// force scrollbars
	outer.appendChild(inner);// add innerdiv
	var hasScrollWidth = parseInt(inner.offsetWidth,10);
	outer.parentNode.removeChild(outer);

	var sw = notScrollWidth - hasScrollWidth;
	if(sw>=0) {//console.log('SW',sw);
		let selector = 'section > div > div',
			styleElmnt = document.createElement('style');
		document.head.appendChild(styleElmnt);
		styleElmnt.sheet.insertRule(selector+'{width:calc(100% + '+sw+'px)}',0);
	}
};
document.addEventListener('DOMContentLoaded',fixScrollbarOffset);
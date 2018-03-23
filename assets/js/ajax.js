"use strict";
class XHR {
constructor() {}
static ajax(url, callback, params) {
	var xhr = new XMLHttpRequest();
	//xhr.open('POST', url, async);
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	this.setHandler(xhr,callback);
	//xhr.send(body.length ? body.join('&') : null);
	//xhr.send(body.length ? body.join('&') : null);
	xhr.send(params || null);
}
static setHandler(xhr, onSuccess, onFailure) {
	xhr.onreadystatechange = function () {
		if(xhr.readyState != 4) return;
		if(xhr.status != 200) onSuccess(false, xhr);
		else {
		    var text = xhr.responseText, json;
		    if(/^(?:\{|\[|\")/.test(text))
			    try {json = JSON.parse(xhr.responseText)}
			    catch(e) {console.log('Error',e,text)};
			onSuccess(json || text, xhr);
		}
	};
}
static load(url, callback, params) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	this.setHandler(xhr,callback);

	if(!params) params = null;
	else if(typeof params === 'string') {}
	else if(typeof params === 'object') 
		params = Object.keys(params).map(p => {return p+'='+params[p]}).join('&');

	xhr.send(params);
}
static playlist(cid, url, callback) {
	var xhr = new XMLHttpRequest();
	
	if(cid===2 && this.token) xhr.setRequestHeader('Authorization','Bearer '+this.token);

	xhr.open('POST', url, true);
	this.setHandler(xhr,callback);
	xhr.send(null);
	//console.log(this.token);
}
static account(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.setRequestHeader('Authorization','Bearer '+this.token);
	this.setHandler(xhr,callback);
	xhr.send(null);
	console.log('account', this.token, url);
}
static request(url, callback) {
	if(!this.token) {
		console.error('Unauthorized request '+url);
		return callback(false,null);
	}
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Authorization','Bearer '+this.token);
	this.setHandler(xhr,callback);
	xhr.send(null);
	//console.log(this.token);
}
static whereami(url, callback) {
	this.ajax(url, callback);
}
};
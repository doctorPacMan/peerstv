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
	xhr.send(params || null);
}
static playlist(cid, url, callback) {
	var xhr = new XMLHttpRequest();
	
	if(cid===2 && this.token) xhr.setRequestHeader('Authorization','Bearer '+this.token);

	xhr.open('POST', url, true);
	this.setHandler(xhr,callback);
	xhr.send(null);
	//console.log(this.token);
}
static request(url, callback) {
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

var $Ajax = function(url, onComplete, params, async) {

		var async = async===false ? false : true;
		var params = params || {}, body = [];
		for (var j in params) body.push(j+'='+encodeURIComponent(params[j]));

		var xhr = new XMLHttpRequest();
		xhr.open('POST', url, async);

		var token = cnapi.getAuthToken();
		if(url.indexOf(cnapi.API_HOST)>=0 && token) xhr.setRequestHeader('Authorization','Bearer '+token);
		//xhr.setRequestHeader('Client-Capabilities','paid_content,adult_content,bytefog');
		xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		xhr.onreadystatechange = function () {
			//console.log(xhr.readyState, xhr.status);
			if(xhr.readyState != 4) return;
			if(xhr.status != 200) onComplete(false, xhr);
			else {
			    var text = xhr.responseText, json;
			    if(/^(?:\{|\[|\")/.test(text))
				    try {json = JSON.parse(xhr.responseText)}
				    catch(e) {console.log('Error',e,text)};
				onComplete(json || text, xhr);
			}
		};
		xhr.send(body.length ? body.join('&') : null);
};

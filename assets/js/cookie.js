"use strict";
var cookie = {
	set : function(name, value, expires, path, domain, secure) {
		var curCookie = escape(name) + "=" + escape(value) +
	      ((expires) ? "; expires=" + new Date(expires).toGMTString() : "") +
    	  ((path) ? "; path=" + path : "; path=/") +
	      ((domain) ? "; domain=" + domain : "") +
    	  ((secure) ? "; secure" : "");
		document.cookie = curCookie;
	},
	get : function(name) {
	
		var dc = document.cookie;
		var prefix = escape(name) + "=";
		var begin = dc.indexOf("; " + prefix);
	
		if (begin == -1) {
			begin = dc.indexOf(prefix);
			if (begin != 0) return null;
  		} 
	  	else 
  			begin += 2;
	
		var end = document.cookie.indexOf(";", begin);
		if (end == -1) end = dc.length;
	
		return unescape(dc.substring(begin + prefix.length, end));
	},
	del : function(name, path, domain) {
		if (this.get(name)) 
		{
			document.cookie = escape(name) + "=" + 
			((path) ? "; path=" + path : "") +
			((domain) ? "; domain=" + domain : "") + "; expires=Thu, 01-Jan-70 00:00:01 GMT";
		}
	}
};
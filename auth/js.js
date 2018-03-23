document.addEventListener('DOMContentLoaded',function(e){

	var span = document.body.querySelector('span');
	span.innerText = 'Authorize';

	var s = document.location.search,
		r = s.match(/code=([^&]+)/),
		code = !r ? null : r[1],
		p = window.parent;
	
	//console.log('AUTH',(!s?'empty':code));
	if(!s) span.innerText = document.location.href;
	else span.innerText = code ? code : 'code failure';
	
	if(s) p.postMessage(s,'*');
},false);
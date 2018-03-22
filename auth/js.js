document.addEventListener('DOMContentLoaded',function(e){

	var span = document.body.querySelector('span');
	span.innerText = 'Authorize';

	var s = document.location.search,
		p = window.parent,
		r = s.match(/code=([^&]+)/),
		code = !r ? null : r[1];

	span.innerText = code ? code : 'failure';
	//console.log('AUTH',s,p);
	p.postMessage(s,'*');

},false);
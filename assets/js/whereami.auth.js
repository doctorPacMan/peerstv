Object.assign(Whereami.prototype,{
API_CLIENT: 'demoapp',
API_SECRET: 'demoapp',
_authorize: function() {

	var refresh = localStorage.getItem('app.retoken');

	console.log('AUTH', !!refresh, this.account());

	if (refresh) this._refreshAuthToken(refresh);
	else this._requestAuthToken(null, null);
	//this._complete();
},
_refreshAuthToken: function(token) {
	console.log('refresh auth token');
	var	apiurl = this.service('auth'),
		apiurl = apiurl.location+'token/',
		params = {
			'client_id':this.API_CLIENT,
			'client_secret':this.API_SECRET,
			'grant_type':'refresh_token',
			'refresh_token':token
		};
	XHR.load(apiurl, this._onloadAuthToken.bind(this,false), params);
},
_requestAuthToken: function(authcode,redirect_uri) {
	console.log('request auth token');
	var	apiurl = this.service('auth'),
		apiurl = apiurl.location+'token/',
		params = {
			'grant_type':'inetra:anonymous',
			'client_secret':this.API_SECRET,
			'client_id':this.API_CLIENT
		};

	if(authcode) {
		params.grant_type = 'authorization_code';
		params.redirect_uri = redirect_uri;
		params.code = authcode;
	}
	XHR.load(apiurl, this._onloadAuthToken.bind(this,!!authcode), params);
},
_onloadAuthToken: function(code, data, xhr) {

	if(!data) return console.log('AUTH ERROR', xhr.status);

	var token = data.access_token,
		expires = new Date().setMilliseconds(data.expires_in * 1e3);
	cookie.set('token', token, expires);
	console.log('token exp '+data.expires_in, new Date(), new Date(expires));
	
	if(data.refresh_token) localStorage.setItem('app.retoken',  data.refresh_token);
	//console.log('token', data);
	//console.log('current token', cookie.get('token'));
	//console.log('refresh token', localStorage.getItem('app.retoken'));
	$App.setAuthToken();
	
	if(!code) return this._complete();
	else {
		var account = this.account();
		if(account && account.token===token) return this._complete();
		else this._requestAccount();
	}
},
_requestAccount: function() {
	var apiurl = this.service('auth').location+'account/';
	//XHR.request(apiurl, $App.setAccount.bind($App));
	XHR.request(apiurl,(data)=>{this.account(data)});
},
setAuthToken: function(token) {
	var tknew = token,
		tkold = this.token();
	if(tknew !== tkold) {
		let tkexp = new Date();
		tkexp.setMilliseconds(15*60*1e3);
		cookie.set('token.current', tknew, tkexp);
		console.log('setAuthToken', tknew);
		XHR.token = tknew;
		//this.account();
	}
},
authorize: function(code, redirect_uri) {
	console.log('authorize',code,redirect_uri);
	this._requestAuthToken(code, redirect_uri);
},
user: function(data) {
	if(data !== undefined) {
		this._auth_userdata = true;
	}
	return this._auth_userdata;
},
account: function(data) {
	if(data) {
		if(!data.username) return console.error('anonymous account '+data.account_id);
		console.log('account set>', data);
		data.token = this.token();
		localStorage.setItem('app.account',JSON.stringify(data));
	}
	var account = localStorage.getItem('app.account');
	account = !account ? null : JSON.parse(account);
	
	if(data) setTimeout(()=>{$App.setAccount(account)},250);
	return account;
},
token: function() {
	//return '8e53532d80ca016d436bc0b0a48bd1da';
	return cookie.get('token');
}
});
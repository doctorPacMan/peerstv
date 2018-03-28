Object.assign(Whereami.prototype,{
API_CLIENT: 'demoapp',
API_SECRET: 'demoapp',
authorize: function(code, redirect_url) {
	console.log('AUTHCODE',code,redirect_url);
	this._requestAuthToken(code,redirect_url);
},
token: function() {return cookie.get('token')},
account: function(data) {

	var ac = localStorage.getItem('app.account'),
		ac = !ac ? {} : JSON.parse(ac);
	delete ac.token;

	var account = Object.assign({
			id: undefined,
			name: undefined,
			expires: undefined,
			refresh: undefined,
			token: this.token()
		}, ac);

	var data = data || {};
	if(data.account_id) account.id = data.account_id;
	if(data.expires) account.expires = data.expires;
	if(data.refresh) account.refresh = data.refresh;
	if(data.username) account.login = data.username;
	localStorage.setItem('app.account', JSON.stringify(account));

	//var update = (Object.keys(data).length || ac.token!==account.token);
	var update = (ac.token!==account.token || ac.id!==account.id || ac.login!==account.login);
	if(update && false) {
		console.log('account update <', ac.id, ac.token);
		console.log('account update >', account.id, account.token);
	}
	return account;
},
_authorize: function() {

	var account = this.account(),
		refresh = account ? account.refresh : null,
		token = this.token();
	console.log('authorize init', token, refresh);
	
	if(token) {
		console.log('token restore');
		this._setToken(token, account.expires, account.refresh);
		this._complete();
	} else if(refresh) {
		console.log('token refresh');
		this._refreshAuthToken(refresh,null);
	}
	else {
		console.log('token request');
		this._requestAuthToken(null,null);
	}
},
_refreshAuthToken: function(token) {
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
_requestAuthToken: function(authcode, redirect_uri) {
	var	apiurl = this.service('auth'),
		apiurl = apiurl.location+'token/',
		params = {
			'client_id':this.API_CLIENT,
			'client_secret':this.API_SECRET,
			'grant_type':'inetra:anonymous'
		};

	if(false) {// TODO ?
		params.grant_type = 'refresh_token';
		params.refresh_token = '<token>';
	}
	else if(authcode) {
		params.grant_type = 'authorization_code';
		params.redirect_uri = redirect_uri;
		params.code = authcode;
	}
	XHR.load(apiurl, this._onloadAuthToken.bind(this,!!authcode), params);
},
_onloadAuthToken: function(code, data, xhr) {

	//console.log('AUTH token onload', code, data);
	if(!data) return console.error('token request failure '+xhr.status);
	else console.log('token onload', code, data);

	//{"access_token":"a84946e8591aae1e95ce2ed316d8c10d","token_type":"bearer","expires_in":450,"refresh_token":"7aa467b7d73a1d35e89810a22cfa5b82"}
	var expires = Date.current().setMilliseconds(data.expires_in * 1e3);
	this._setToken(data.access_token, expires, data.refresh_token);

	if(code) this._requestAccount();
},
_requestAccount: function() {
	var apiurl = this.service('auth').location+'account/';
	XHR.request(apiurl,(data)=>{
		console.log('account',data);
		this.account(data);
		this._complete();
		$App.setAccount();
	});
},
_setToken: function(token, expires, refresh) {
	cookie.set('token', token, expires);
	this.account({expires:expires, refresh:refresh});
	//this._requestAccount();
	
	var xd = new Date(expires),
		xt = xd - Date.current(),
		xt = Math.floor(xt/1000);
	//xt = 5;
	if(this._refresh_timeout) clearTimeout(this._refresh_timeout);
	this._refresh_timeout = setTimeout(this._refreshAuthToken.bind(this,refresh), xt*1e3);
	//console.log('token '+token+' timeout '+xt+'s');
	//console.log(this.token(), this.account().token);
},
getAccount: function(callback) {
	var apiurl = this.service('auth').location+'account/';
	XHR.request(apiurl,(data)=>{
		this.account(data);
		callback(data);
	});
}
});
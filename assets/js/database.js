'use strict';
class Database {
constructor(name, version) {
	this.IDBD = null;
	this.name = name;
	this._version = version;
	this._pending = [];

	this._storages = {
		channels: new Storage_channels('channels')
	};

	return this.zees();
	//return this.open();
}
storage(name) {
	return this._storages[name];
}
createStorage() {}
deleteStorage() {}
open() {
	//console.log('OPEN', this.name, this._version);
	var request;
	if(isNaN(this._version)) request = indexedDB.open(this.name);
	else request = indexedDB.open(this.name, this._version);
	
	request.onerror = this.onopen.bind(this,false);
	request.onsuccess = this.onopen.bind(this,true);
	request.onupgradeneeded = this.onupgrade.bind(this);

	return this.zees();
}
onready(callback) {
	if(undefined === callback) return !this._pending;
	else if(!this._pending) setTimeout(callback,50);
	else this._pending.push(callback);
	return this.zees();
}
onopen(success, event) {
	var db = event.target.result,
		sn = Array.from(db.objectStoreNames);

	//console.log('ONOPEN', db.name+'.'+db.version, 'stores: '+sn.join(','));
	if(success) this.IDBD = db;
	if(success) this._version = db.version;

	for(var sn in this._storages) this.storage(sn).init(db);

	if(this._pending) {
		let cb;
		while(cb = this._pending.shift()) cb(success,this.IDBD);
		delete this._pending;
	}
}
onupgrade(event) {
	var db = event.target.result;
	console.log('UPGRADE', db);
	for(var sn in this._storages) this.storage(sn).init(db);
	//db.deleteObjectStore();
}
zees() {
	if(!this._zis) this._zis = {
		storage: this.storage.bind(this),
		onready: this.onready.bind(this),
		getOne: this.getOne.bind(this),
		getAll: this.getAll.bind(this),
		clean: this.clean.bind(this),
		open: this.open.bind(this),
		fill: this.fill.bind(this),
		push: this.push.bind(this),
		name: this.name
	};
	return this._zis;
}
clean(storeName,string) {
	for(var sn in this._storages) this.storage(sn).clean();
}
push(storeName,string) {
	console.log('PUSH ['+storeName+'] "'+string+'"');
	var db = this.IDBD,
		sn = storeName,
		trans = db.transaction(sn,'readwrite'),
		store = trans.objectStore(sn);
	
	var date = new Date(string),
		time = date.getTime();
	var data = {
		'time':time,
		'date':date,
		'text':string
	};
	var request = store.add(data);
	request.onerror = request.onsuccess = this.onRequestComplete.bind(this);
}
fill() {
	console.log('FILL');

	var data = [], time = Date.now();
	for(var j=0;j<5;j++) data.push({'time':time,'item':'Item 0'+j});
	//for(var j=0;j<5;j++) data.push({'key':j,'time':time,'item':'Item 0'+j});
	//data[2].key = 0;console.log([].concat(data));

	var db = this.IDBD,
		sn = 'times',
		tr = db.transaction(sn,'readwrite'),
		so = tr.objectStore(sn), aborted;
	tr.onerror = function(e){
		var request = e.target,//so = request.source,
			trans = request.transaction,
			error = request.error;
		if(!!trans.error) return;
		console.log('Request error','['+error.code+'] '+error.name+': '+error.message);
		aborted = request;//console.log(request);
	};
	tr.onabort = function(e){
		var trans = e.target;
		console.error('Transaction abort',trans.error.toString());
		console.log(aborted);
		console.log(trans);
	};
	tr.oncomplete = this._onFillComplete.bind(this);

	console.log(data)
	var d = [].concat(data), v, r;
	while(v = d.shift()) {r = so.add(v)};
	console.log('Transaction start');
	//data.forEach(v=>{store.put(v)});

}
_onFillComplete(e) {
	var trans = e.target;
	console.log('FILL complete', e);
}
getAll(callback) {
	var db = this.IDBD,
		storeNames = Array.from(db.objectStoreNames),
		trans = db.transaction(storeNames,'readonly');
	
	var storeItems = {};
	trans.oncomplete = trans.onerror = function(storeItems,event){
		callback(storeItems);
	}.bind(this,storeItems);

	for(var sn, so, n=0; n<storeNames.length; n++) {
		sn = storeNames[n];
		storeItems[sn] = [];
		so = trans.objectStore(sn);
		so.openCursor(null,'next').onsuccess = function(e) {
			var cursor = e.target.result;
			if(!cursor) return;
			storeItems[sn].push(cursor.value);
			cursor.continue();
		};
	}
	return;
}
onGetAllComplete(storeItems,e) {
	console.log('onGetAllComplete',e);
	console.log(storeItems);
}
getOne() {
	
	var db = this.IDBD, sn = 'times',
		trans = db.transaction(sn,'readonly'),
		store = trans.objectStore(sn), 
		//query = 1518793010000,
		query = 1518792959000,
		count,
		//count = 1,
		index = 'time';

	var DBIndex = store.index(index),
		request = DBIndex.getAll(query, count);
	trans.onerror = trans.oncomplete = this.onTransactionComplete.bind(this);
	request.onerror = request.onsuccess = this.onRequestComplete.bind(this);

	return sn;
}
onTransactionComplete(e) {
	console.log('TRANS DONE',e);
}
onRequestComplete(e) {
	var success = (e.type==='success'),
		request = e.target,
		result = request.result,
		results = result ? [].concat(result) : [];

	if(!success) console.error('IDBRequest failure > '+request.error); 
	else {
		console.group('IDBRequest success ('+results.length+')');
		results.forEach(r=>{console.log(r)});
		console.groupEnd();
	}
}
};
//window.database = new cIndexedDB('appDatabase');
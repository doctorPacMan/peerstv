'use strict';
class Database {
constructor(name) {
	this.TRACE = true;
	this.IDBD = null;
	this.name = name;
	this.version = 1;
	this._pending = [];
	this._storages = {
		channels: new Storage_channels('channels')
	};
	return this.zees();
	//return this.open();
}
delete() {
	var request = indexedDB.deleteDatabase(this.name);
	request.onsuccess = function(e) {this.trace('deleted')}.bind(this);
	request.onerror = function(e) {this.trace('delete failed')}.bind(this);
}
storage(name) {
	return this._storages[name];
}
createStorage() {}
deleteStorage() {}
open() {
	//this.trace('open');
	var request = indexedDB.open(this.name, this.version);
	request.onupgradeneeded = this.onupgrade.bind(this);
	request.onsuccess = this.onopen.bind(this,true);
	request.onerror = this.onopen.bind(this,false);
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

	this.trace('open '+ (success?'success':'failure'));
	if(success) this.IDBD = db;

	for(var sn in this._storages) this.storage(sn).init(db);

	if(this._pending) {
		let cb;
		while(cb = this._pending.shift()) cb(success,this.IDBD);
		delete this._pending;
	}
}
onupgrade(event) {
	var db = event.target.result;
	var tr = event.target.transaction;
	tr.oncomplete = ()=>{this.trace('upgrade complete')};
	for(var sn in this._storages) this.storage(sn).init(db);
	//for(var sn in this._storages) this.storage(sn).init(db);
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
clean(storeName) {
	if(storeName) {
		this.trace('clean ['+storeName+']');
		this.storage(storeName).clean();
	}
	else for(var sn in this._storages) {
		this.trace('clean ['+sn+']');
		this.storage(sn).clean();
	}
}
push(storeName,string) {
	this.trace('push ['+storeName+']',string);
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
	this.trace('fill');
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
	this.trace('fill complete');
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
trace() {
	if(!this.TRACE) return;
	var args = Array.from(arguments);
	args.unshift('color:olivedrab;font-weight:bold');
	args.unshift('%cINDB#'+this.name+' >');
	console.log.apply(console, args);
}
};
//window.database = new cIndexedDB('appDatabase');
'use strict';
class Storage {
constructor(name) {
	this.name = name;
	this.dbase = null;
	this._stor = null;
	//this.pending = true;
	this.initialize();
}
initialize() {}
init(db) {
	if (this.dbase!==null) return;
	else this.dbase = db;
	
	var exists = Array.from(db.objectStoreNames).indexOf(this.name)>=0;
	this.trace((exists?'append':'create')+' store "'+this.name+'"');

	if(!exists) this._stor = this.createStore(db);
	else this._stor = this.countStore();
}
createStore() {
	var param = {keyPath:'key',autoIncrement:true},
		store = this.dbase.createObjectStore(this.name,param);
	return store;
}
countStore() {
	var store = this.transaction('readonly',function(e){
		this.trace(request.result+' items');
	}.bind(this)), request = store.count();
	return store;
}
clean(callback) {
	var	callback = callback || function(success, count){},
		count = 0,
		store = this.transaction('readwrite',function(e){
			//console.log('DROP items '+count, e.type);
			callback(e.type==='complete', count);
		});

	store.openCursor(null,'next').onsuccess = function(e) {
		var request, cursor = e.target.result;
		if(cursor) {
			request = cursor.delete();
			request.onsuccess = function(){cursor.continue(); count++};
		}
	};
}
fill(data, callback) {
	var	callback = callback || function(success, count){},
		count = 0,
		items = [].concat(data),
		store = this.transaction('readwrite',function(e){
			//console.log('FILL items '+count, e.type);
			callback(e.type==='complete', count);
		});

	var request, v, k=0;
	while(v = items.shift()) {
		request = store.add(v);
		request.onsuccess = function(){count++};
	};
}
transaction(mode, callback) {
	var	callback = callback || function(event){},
		mode = (mode || 'readwrite' || 'readonly'),
		dbase = this.dbase,
		trans = dbase.transaction(this.name,mode),
		store = trans.objectStore(this.name),
		abort;// pointer to bad request
	trans.onerror = function(e){
		var request = e.target,
			error = request.error;
		if(!!request.transaction.error) return; else abort = request;
		console.error('RQ error','['+error.code+'] '+error.toString());
		//console.log(request);
	};
	trans.onabort = function(e){
		var trans = e.target;
		console.error('TR abort',trans.error.toString());
		//console.log(trans,abort);
		callback(e);
	};
	trans.oncomplete = function(e){
		//console.log('TR complete',e);
		callback(e);
	};
	return store;
}
getAll(callback) {
	var	callback = callback || function(items){},
		items = [],
		cback = function(items,e){callback(items)}.bind(this,items),
		store = this.transaction('readonly',cback);
	
	store.openCursor(null,'next').onsuccess = function(e) {
		var cursor = e.target.result;
		if(!cursor) return items;
		items.push(cursor.value);
		cursor.continue();
	};
	return items;
}
getAllByIndex(ndx, callback) {
	//console.log('getAllByIndex', ndx, typeof(callback));
	var	items = [],
		cback = function(items,e){callback(items)}.bind(this,items),
		store = this.transaction('readonly',cback),	
		index = store.index(ndx);

	index.openCursor(null,'next').onsuccess = function(e) {
		var cursor = e.target.result;
		if(!cursor) return items;
		items.push(cursor.value);
		cursor.continue();
	};
	return items;
}
getByIndex(ndx, key, callback) {
	var keys;
	if(Array.isArray(key)) keys = [].concat(key);
	else keys = typeof(key)=='string' ? key.split(',') : [];
	
	var	items = [],
		cback = function(items,e){callback(items)}.bind(this,items),
		store = this.transaction('readonly',cback),	
		index = store.index(ndx);
	console.log('getByIndex:'+this.name+'.'+ndx, keys, typeof(callback));

	if(keys.length<=1) {//get one or all
		var range = keys.length==1 ? IDBKeyRange.only(keys[0]) : null;
		index.openCursor(range,'next').onsuccess = function(e){
			var cursor = e.target.result;
			if(!cursor) return items;
			items.push(cursor.value);
			cursor.continue();
		};
	} else {// get several
		keys.forEach(k=>{
			index.get(k).onsuccess = function(e) {items.push(e.target.result)};
		});
	}
	//index.get(key).onsuccess = function(e) {items.push(e.target.result)};
}
trace() {
	return;
	var args = Array.from(arguments);
	args.unshift('color: green;font-weight:bold');
	args.unshift('%cStorage:'+this.name+' >');
	console.log.apply(console, args);
}
};
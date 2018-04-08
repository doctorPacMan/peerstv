'use strict';
class Storage_channels extends Storage {
initialize() {
	this.trace('initialize');
}
createStore() {
	var store = this.dbase.createObjectStore(this.name,{keyPath:'key',autoIncrement:true});
	store.createIndex('cnid','channelId',{unique:true});
	store.createIndex('name','title',{unique:false});
	//store.createIndex('time','time',{unique:false});
	//store.createIndex('porn','porn',{unique:false});
	return this.store = store;
}
channels(cnid, callback) {
	if(typeof callback == 'function') this.getByIndex('cnid', cnid, callback);
	else return new Promise(function(resolve, reject){
			var callback = function(items){resolve(items)};
			this.getByIndex('cnid', cnid, callback);
		}.bind(this));
}
update(cnid, data, callback) {
	console.log('update', cnid);

	var	itemOut, itemNew,
		handler = function(e){callback(itemNew,itemOut)}.bind(this),
		store = this.transaction('readwrite',handler),
		index = store.index('cnid'),
		range = IDBKeyRange.only(cnid);

    index.openCursor(range).onsuccess = function(e){
        var cursor = e.target.result,
			key = !cursor ? undefined : cursor.key,
    		old = !cursor ? undefined : cursor.value;

        var upd = Object.assign({},old);
        for(var j in data) upd[j] = data[j];
        //upd.time = (new Date);
        delete upd.value;
        cursor.update(upd).onsuccess = function(e) {
        	var newkey = e.target.result;
			itemOut = old;
			itemNew = upd;
        };
    };   
}
};
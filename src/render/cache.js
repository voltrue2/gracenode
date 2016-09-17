'use strict';

// cache memory size default is 2MB
var memSize = 2000000;
var cacheMap = {};
var cache = [];
var cacheSize = 0;

exports.setMemSize = function __renderCacheSetMemSize(mem) {
	memSize = mem;
};

// ttl is in ms for how long it should last
// exmaple if the cache needs to last for 24 hours, then ttl = 8640000
exports.set = function __renderCacheSet(data, rendered, ttl) {
	var size = Buffer.byteLength(rendered);
	if (cacheSize + size > memSize) {
		discard((cacheSize + size) - memSize);
	} else {
		discard(0);
	}
	if (size + cacheSize > memSize) {
		return;
	}
	var key = createKey(data);
	cache.push({
		rendered: rendered,
		ttl: ttl + Date.now(),
		size: size,
		key: key
	});
	var index = cache.length - 1;
	cacheMap[key] = index;
	cacheSize += Buffer.byteLength(rendered);
};

exports.get = function __renderCacheGet(data) {
	discard(0);
	var key = createKey(data);
	var index = cacheMap[key];
	if (index !== undefined) {
		var res = cache[index];
		if (res && Date.now() <= res.ttl) {
			return res.rendered;
		}
		cacheMap[key] = null;
		return null;
	}
	return null;
};

function discard(removeMemSize) {
	var copy = cache.concat([]);
	var tmp = [];
	var map = {};
	for (var i = 0, len = copy.length; i < len; i++) {
		var res = cache[i];
		if (Date.now() >= res.ttl) {
			cacheSize -= res.size;
			if (removeMemSize > 0) {
				removeMemSize -= res.size;
			}
			continue;
		}
		if (removeMemSize > 0) {
			cacheSize -= res.size;
			removeMemSize -= res.size;	
			continue;
		}
		tmp.push(res);
		map[res.key] = tmp.length - 1;
	}
	cache = tmp;
	cacheMap = map;
}

function createKey(data) {
	return JSON.stringify(data);
}

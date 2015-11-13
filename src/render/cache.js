'use strict';

var cache = {};

// ttl is in ms for how long it should last
// exmaple if the cache needs to last for 24 hours, then ttl = 8640000
exports.set = function (data, rendered, ttl) {
	var key = createKey(data);
	cache[key] = {
		rendered: rendered,
		ttl: ttl + Date.now()
	};
};

exports.get = function (data) {
	var key = createKey(data);
	if (cache[key]) {
		var res = cache[key];
		if (Date.now() <= res.ttl) {
			return res.rendered;
		}
		delete cache[key];
		return null;
	}
	return null;
};

function createKey(data) {
	return JSON.stringify(data);
}

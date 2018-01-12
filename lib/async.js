'use strict';

/**
async library is not v8 crankshft friendly at all
and we wanto support node.js that does not support Promise
*/

module.exports = {
	eachSeries: eachSeries,
	forEachSeries: eachSeries,
	// eachSeries/forEachSeries w/ extra parameters
	loopSeries: loopSeries,
	each: eachSeries,
	forEach: eachSeries,
	series: series
};

function eachSeries(list, each, cb) {
	if (!list || !list.length) {
		return _finish(cb);
	}
	var item = list[0];
	if (item === undefined) {
		return _finish(cb);
	}
	each(item, _onEachSeries.bind(null, {
		list: list.slice(1),
		each: each,
		cb: cb
	}));
}

function _onEachSeries(bind, error) {
	if (error) {
		return _finish(bind.cb, error);
	}
	eachSeries(bind.list, bind.each, bind.cb);
}

function loopSeries(list, params, each, cb) {
	if (!list || !list.length) {
		return _finish(cb);
	}
	var item = list[0];
	if (item === undefined) {
		return _finish(cb);
	}
	each(item, params, _onLoopSeries.bind(null, {
		list: list.slice(1),
		params: params,
		each: each,
		cb: cb
	}));
}

function _onLoopSeries(bind, error) {
	if (error) {
		return _finish(bind.cb, error);
	}
	loopSeries(
		bind.list,
		bind.params,
		bind.each,
		bind.cb
	);
}

function series(list, cb) {
	if (!list || !list.length) {
		return _finish(cb);
	}
	var item = list[0];
	if (item === undefined) {
		return _finish(cb);
	}
	if (typeof item !== 'function') {
		return _finish(cb, new Error('FoundNonFunctionInList'));
	}
	item(_onSeries.bind(null, {
		list: list.slice(1),
		cb: cb
	}));
}

function _onSeries(bind, error) {
	if (error) {
		return _finish(bind.cb, error);
	}
	series(bind.list, bind.cb);
}

function _finish(cb, error) {
	if (typeof cb === 'function') {
		cb(error);
	}
}


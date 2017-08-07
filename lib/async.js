'use strict';

/**
async library is not v8 crankshft friendly at all
and we wanto support node.js that does not support Promise
*/

module.exports = {
	eachSeries: eachSeries,
	forEachSeries: eachSeries,
	loopSeries: loopSeries,
	each: forEach,
	forEach: forEach,
	series: series,
	parallel: parallel
};

function eachSeries(list, each, cb, _index) {
	if (!list || !list.length) {
		return cb();
	}
	if (!_index) {
		_index = 0;
	}
	var item = list[_index];
	if (item === undefined) {
		return cb();
	}
	var onEachSeries = function _onEachSeries(error) {
		if (error) {
			return cb(error);
		}
		eachSeries(list, each, cb, _index += 1);
	};
	each(item, onEachSeries);
}

function loopSeries(list, params, each, cb, _index) {
	if (!list || !list.length) {
		return cb();
	}
	if (!_index) {
		_index = 0;
	}
	var item = list[_index];
	if (item === undefined) {
		return cb();
	}
	var onLoopSeries = function _onLoopSeries(error) {
		if (error) {
			return cb(error);
		}
		loopSeries(list, params, each, cb, _index += 1);
	};
	each(item, params, onLoopSeries);
}

function forEach(list, each, cb, _counter) {
	if (!list || !list.length) {
		return cb();
	}
	if (!_counter) {
		_counter = 0;
	}
	var len = list.length;
	var onForEach = function _onForEach(error) {
		if (error) {
			return cb(error);
		}
		_counter += 1;
		if (_counter === len) {
			return cb();
		}
	};
	for (var i = 0; i < len; i++) {
		each(list[i], onForEach);
	}
}

function series(list, cb, _index) {
	if (!list || !list.length) {
		return cb();
	}
	if (!_index) {
		_index = 0;
	}
	var item = list[_index];
	if (item === undefined) {
		return cb();
	}
	var onSeries = function _onSeries(error) {
		if (error) {
			return cb(error);
		}
		series(list, cb, _index += 1);
	};
	if (typeof item !== 'function') {
		return cb(new Error('FoundNonFunctionInList'));
	}
	item(onSeries);
}

function parallel(list, cb, _counter) {
	if (!list || !list.length) {
		return cb();
	}
	if (!_counter) {
		_counter = 0;
	}
	var len = list.length;
	var onParallel = function _onParallel(error) {
		if (error) {
			return cb(error);
		}
		_counter += 1;
		if (_counter === len) {
			return cb();
		}
	};
	for (var i = 0; i < len; i++) {
		if (typeof list[i] !== 'function') {
			return cb(new Error('FoundNonFunctionInList'));
		}
		list[i](onParallel);
	}
}


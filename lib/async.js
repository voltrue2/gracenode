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
	each: forEach,
	forEach: forEach,
	series: series,
	parallel: parallel
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

function forEach(list, each, cb, _counter) {
	if (!list || !list.length) {
		return _finish(cb);
	}
	if (!_counter) {
		_counter = 0;
	}
	var len = list.length;
	var params = {
		_counter: _counter,
		len: len,
		cb: cb
	};
	for (var i = 0; i < len; i++) {
		each(list[i], _onForEach.bind(params));
	}
}

function _onForEach(error) {
	if (error) {
		return _finish(this.cb, error);
	}
	this._counter += 1;
	if (this._counter === this.len) {
		return _finish(this.cb);
	}
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
	item(_onSeries.bind({
		list: list.slice(1),
		cb: cb
	}));
}

function _onSeries(error) {
	// prevent the callback to be called more than once...
	if (this._called) {
		return _finish(this.cb, new Error('CallbackAlreadyCalled'));
	}
	this._called = true;
	if (error) {
		return _finish(this.cb, error);
	}
	series(this.list, this.cb);
}

function parallel(list, cb, _counter) {
	if (!list || !list.length) {
		return _finish(cb);
	}
	if (!_counter) {
		_counter = 0;
	}
	var len = list.length;
	var params = {
		list: list,
		_counter: _counter,
		len: len,
		cb: cb
	};
	for (var i = 0; i < len; i++) {
		if (typeof list[i] !== 'function') {
			return _finish(cb, new Error('FoundNonFunctionInList'));
		}
		list[i](_onParallel.bind(params));
	}
}

function _onParallel(error) {
	if (error) {
		return _finish(this.cb, error);
	}
	this._counter += 1;
	if (this._counter === this.len) {
		return _finish(this.cb);
	}
}

function _finish(cb, error) {
	if (typeof cb === 'function') {
		cb(error);
	}
}


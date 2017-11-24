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

function eachSeries(list, each, cb, _index) {
	if (!list || !list.length) {
		return _finish(cb);
	}
	if (!_index) {
		_index = 0;
	}
	var item = list[_index];
	if (item === undefined) {
		return _finish(cb);
	}
	each(item, _onEachSeries.bind({
		list: list,
		each: each,
		cb: cb,
		_index: _index
	}));
}

function _onEachSeries(error) {
	if (error) {
		return _finish(this.cb, error);
	}
	eachSeries(this.list, this.each, this.cb, this._index += 1);
}

function loopSeries(list, params, each, cb, _index) {
	if (!list || !list.length) {
		return _finish(cb);
	}
	if (!_index) {
		_index = 0;
	}
	var item = list[_index];
	if (item === undefined) {
		return _finish(cb);
	}
	each(item, params, _onLoopSeries.bind({
		list: list,
		params: params,
		each: each,
		cb: cb,
		_index: _index
	}));
}

function _onLoopSeries(error) {
	if (error) {
		return _finish(this.cb, error);
	}
	loopSeries(
		this.list,
		this.params,
		this.each,
		this.cb,
		this._index += 1
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

function series(list, cb, _index) {
	if (!list || !list.length) {
		return _finish(cb);
	}
	if (!_index) {
		_index = 0;
	}
	var item = list[_index];
	if (item === undefined) {
		return _finish(cb);
	}
	if (typeof item !== 'function') {
		return _finish(cb, new Error('FoundNonFunctionInList'));
	}
	item(_onSeries.bind({
		list: list,
		cb: cb,
		_index: _index
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
	series(this.list, this.cb, this._index += 1);
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


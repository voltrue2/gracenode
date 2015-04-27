'use strict';

var gracenode = require('gracenode');
var log = gracenode.log.create('profiler');

module.exports.create = function (name) {
	return new Profiler(name);
};

function Profiler(name) {
	this._name = name;
	this._startTime = 0;
	this._nowTime = 0;
	this._marks = [];
	this._running = false;
	this._enabled = gracenode.log.isEnabled('debug');
	log.verbose('profiler [' + name + '] enabled:', this._enabled);
}

Profiler.prototype.start = function () {

	if (!this._enabled) {
		return;
	}

	if (this._running) {
		return log.warning('profiler is currently running. invoke "stop" before calling "start"');
	}
	
	log.debug('profiling of "' + this._name + '" started');

	var date = new Date();
	this._startTime = date.getTime();
	this._nowTime = this._startTime;
	this._running = true;
};

Profiler.prototype.mark = function (name) {

	if (!this._enabled) {
		return;
	}

	if (!this._running) {
		return log.warning('mark called, but profiler "' + this._name + '" is not running');
	}
	
	var date = new Date();
	var now = date.getTime();
	var time = now - this._nowTime;
	this._nowTime = now;
	this._marks.push({
		name: name,
		time: time 
	});
};

Profiler.prototype.stop = function () {

	if (!this._enabled) {
		return;
	}

	if (!this._running) {
		return log.warning('stop called, but profiler "' + this._name + '" is not running');
	}

	log.debug('profiling of "' + this._name + '" stopped');
	
	var totalTime = Date.now() - this._startTime;
	var table = [];
	var total = 0;
	for (var i = 0, len = this._marks.length; i < len; i++) {
		var item = this._marks[i];
		if (!item.name) {
			// no name provided, skip it
			continue;
		}
		total += item.time;
		table.push({
			name: item.name,
			'execution time': item.time + ' milliseconds'
		});
	}
	// add total execution time
	table.push({
		name: 'total execution time',
		'execution time': totalTime + ' milliseconds'
	});
	log.table(table);

	// flush out and reset
	this._startTime = 0;
	this._nowTime = 0;
	this._marks = [];
	this._running = false;
};


var gracenode = require('../../');
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
}

Profiler.prototype.start = function () {
	if (this._running) {
		return log.warning('profiler is currently running. invoke "stop" before calling "start"');
	}
	
	log.verbose('profiling of "' + this._name + '" started');

	var date = new Date();
	this._startTime = date.getTime();
	this._nowTime = this._startTime;
	this._running = true;
};

Profiler.prototype.mark = function (name) {
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
	if (!this._running) {
		return log.warning('stop called, but profiler "' + this._name + '" is not running');
	}

	log.verbose('profiling of "' + this._name + '" stopped');

	var date = new Date();
	var now = date.getTime();
	var totalTime = now - this._startTime;
	var logList = [];
	var len = this._marks.length;
	var gap = 0;
	var space = '';
	var msg = ' ' + this._name + ' took [' + totalTime + ' ms] ';
	var msgLen = msg.length;
	var longest = msgLen;
	// degenrate profiling logs
	for (var i = 0; i < len; i++) {
		var item = this._marks[i];
		var str = ' > ' + item.name + ' took [' + item.time + ' ms] ';
		if (longest < str.length) {
			longest = str.length;
		}
		logList.push(str);
	}
	var line = '+';
	for (var a = 0; a < longest; a++) {
		line += '-';
	}
	line += '+';
	log.verbose(line);
	for (var j = 0; j < len; j++) {
		gap = longest - logList[j].length;
		space = '';
		for (var n = 0; n < gap; n++) {
			space += ' ';
		}
		log.verbose('|' + logList[j] + space + '|');
		log.verbose(line);
	}
	gap = longest - msgLen;
	space = '';
	for (var b = 0; b < gap; b++) {
		space += ' ';
	}
	log.verbose('|' + msg + space + '|');
	log.verbose(line);
	// flush out and reset
	this._startTime = 0;
	this._nowTime = 0;
	this._marks = [];
	this._running = false;
};

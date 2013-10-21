
var startTime;
var nowTime;
var marks = [];

var gracenode = require('../../gracenode');
var log = gracenode.log.create('profiler');

module.exports.start = function () {
	var date = new Date();
	startTime = date.getTime();
	nowTime = startTime;
};

module.exports.mark = function (name) {
	var date = new Date();
	var now = date.getTime();
	var time = now - nowTime;
	nowTime = now;
	marks.push({
		name: name,
		time: time 
	});
};

module.exports.stop = function () {
	var date = new Date();
	var now = date.getTime();
	var totalTime = now - startTime;
	var logList = [];
	var len = marks.length;
	var gap = 0;
	var space = '';
	var msg = ' Application took [' + totalTime + ' ms] ';
	var msgLen = msg.length;
	var longest = msgLen;
	// degenrate profiling logs
	for (var i = 0; i < len; i++) {
		var item = marks[i];
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
	startTime = 0;
	nowTime = 0;
	marks = [];
};

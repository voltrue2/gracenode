
var startTime;
var nowTime;
var marks = [];

var gracenode = require('../../gracenode');
var log = gracenode.log.create('profiler');

exports.start = function () {
	var date = new Date();
	startTime = date.getTime();
	nowTime = startTime;
};

exports.mark = function (name) {
	var date = new Date();
	var now = date.getTime();
	var time = now - nowTime;
	nowTime = now;
	marks.push({
		name: name,
		time: time 
	});
};

exports.stop = function () {
	var date = new Date();
	var now = date.getTime();
	var totalTime = now - startTime;
	var logList = [];
	var longest = 0;
	var len = marks.length;
	var gap = 0;
	var space = '';
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
	for (var i = 0; i < longest; i++) {
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
	var msg = ' Application took [' + totalTime + ' ms] ';
	gap = longest - msg.length;
	space = '';
	for (var n = 0; n < gap; n++) {
		space += ' ';
	}
	log.verbose('|' + msg + space + '|');
	log.verbose(line);
	// flush out and reset
	startTime = 0;
	nowTime = 0;
	marks = [];
};

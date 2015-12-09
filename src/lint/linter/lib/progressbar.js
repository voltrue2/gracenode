
var gn = require('../../../gracenode');
/*
options {
	bar
	label
	color
	length
}
*/
function Progressbar(len, options) {
	// progress bar length is always 20 letter-long
	this.barLen = (options && options.length) ? options.length : 40;
	this.len = len;
	// + 2 for [ and ]
	// + 5 for percentage display xxx%
	// and the length of this.label
	// so this.len + 7 + this.label.length
	this.label = (options && options.label) ? options.label : '';
	this.clearLen = this.barLen + 7 + this.label.length;
	this.it = 0;
	this.bar = (options && options.bar) ? options.bar : '■';
	this.color = (options && options.color) ? options.color : module.exports.COLORS.YELLOW;
}

Progressbar.prototype.start = function () {
	if (!gn.log.isEnabled('verbose')) {
		return;
	}	
	var spaces = '';
	for (var j = 0; j < this.barLen; j++) {
		spaces += ' ';
	}
	process.stdout.write('\n' + this.color + this.label + '[' + spaces + '] 000%');
	this.it = 0;
};

Progressbar.prototype.update = function () {
	if (!gn.log.isEnabled('verbose')) {
		return;
	}	
	this.it += 1;
	var clear = '';
	var progress = '';
	var pad = '';
	var rate = Math.floor((this.it / this.len) * 100);
	var rateLen = rate.toString().length;
	// clear all text
	for (var i = 0; i < this.clearLen; i++) {
		clear += '\010';
	}
	process.stdout.write(clear);
	// calculate progress
	var barProgress = Math.floor(this.barLen * (rate / 100));
	for (var p = 0; p < this.barLen; p++) {
		if (p <= barProgress) {
			// progressbar
			progress += this.bar;
		} else {
			// fill the reset with spaces
			progress += ' ';
		}
	}
	// calculate percentage
	if (rateLen < 3) {
		pad += '0';
	}
	if (rateLen < 2) {
		pad += '0';
	}
	// draw
	process.stdout.write(this.label + '[' + progress + '] ' + pad + rate + '%');
};

Progressbar.prototype.end = function () {
	if (!gn.log.isEnabled('verbose')) {
		return;
	}	
	process.stdout.write('\033[0m\n\n');
};

module.exports.COLORS = {
	RED: '\033[0;41m\033[1;37m',
	PURPLE: '\033[0;45m\033[\033[1;37m',
	BLUE: '\033[0;44m\033[1;32m',
	GREEN: '\033[0;42m\033[1;34m',
	YELLOW: '\033[0;40m\033[1;33m',
	GRAY: '\033[0;47m\033[1;30m'
};

module.exports.Progressbar = Progressbar;


var exec = require('child_process').exec;
var gn = require('gracenode');
var async = require('async');
var logger = gn.log.create('daemon-list');

module.exports = function () {
	var processList = [];
	// get the list of daemon processes
	var getProcessList = function (next) {
		exec('ps aux | grep "node "', function (error, stdout) {
			if (error) {
				return next(error);
			}
			var list = stdout.split('\n');
			for (var i = 0, len = list.length; i < len; i++) {
				if (list[i].indexOf('gracenode/scripts/daemon/monitor') !== -1) {
					processList.push({ br: '\n', prefix: '	Daemon monitor process:', p: trim(list[i]) });
					continue;
				}
				if (list[i].indexOf('--daemon') !== -1) {
					processList.push({ br: '', prefix: '		Application daemon process:', p: trim(list[i]) });
				}
			}
			next();
		});
	};
	// get the list of pid and display
	// $11 = process name $2 = pid
	var getPids = function (next) {
		var seen = [];
		async.eachSeries(processList, function (item, callback) {
			exec('ps aux | grep "' + item.p + '" | awk \'{ print $11 } { print $2 }\'', function (error, stdout) {
				if (error) {
					return next(error);
				}
				var list = stdout.split('\n');
				while (list.length) {
					var elm = list.shift();
					var pid = list.shift();
					if (seen.indexOf(pid) === -1 && elm === process.execPath) {
						console.log(item.br, color(item.prefix, '0;33'), color(item.p, '0;32'), color('(pid:' + pid + ')', '1;35'));
						seen.push(pid);
					}
				}
				callback();
			});
		}, next);
	};
	// display process list along with pids
	var display = function (error) {
		if (error) {
			return gn.exit(error);
		}
		console.log('\n');
		gn.exit();
	};
	// execute the commands
	async.series([getProcessList, getPids], display);
};

function trim(str) {
	var pid = '';
	var sep = str.split(' ');
	return str.substring(str.indexOf(process.execPath));
}

function color(str, colorCode) {
	return '\033[' + colorCode + 'm' + str + '\033[0m';
}

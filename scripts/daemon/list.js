var exec = require('child_process').exec;
var gn = require('gracenode');
var async = require('async');
var lib = require('./lib');
var logger = gn.log.create('daemon-list');

module.exports = function () {
	var processList = [];
	var processMap = {};
	// get the list of daemon processes
	var getProcessList = function (next) {
		exec('ps aux | grep "node "', function (error, stdout) {
			if (error) {
				return next(error);
			}
			var list = stdout.split('\n');
			for (var i = 0, len = list.length; i < len; i++) {
				if (list[i].indexOf('gracenode/scripts/daemon/monitor') !== -1) {
					processList.push({ prefix: '	Daemon monitor process:', p: trim(list[i]) });
					continue;
				}
				if (list[i].indexOf('--daemon') !== -1) {
					processList.push({ prefix: '		Application daemon process:', p: trim(list[i]) });
				}
			}
			next();
		});
	};
	// get the list of pid and display
	// $11 = process, $12 = $1, $14 = $3, $2 = pid
	var getPids = function (next) {
		var seen = [];
		async.eachSeries(processList, function (item, callback) {
			exec('ps aux | grep "' + item.p + '" | awk \'{ print $11 } { print $2 } { print $12} { print $14 }\'', function (error, stdout) {
				if (error) {
					return next(error);
				}
				// parse and group processes
				var list = stdout.split('\n');
				while (list.length) {
					var execPath = list.shift();
					var pid = list.shift();
					var processName = list.shift(); // tells us if this process is monitor or not
					var appPath = list.shift() // if monitor process, this tells us which process it is watching
					if (seen.indexOf(pid) === -1 && execPath === process.execPath) {
						var key;
						var name = 'app';
						var path;
						// check for monitor process
						if (processName.indexOf('/node_modules/gracenode/scripts/daemon/monitor') !== -1) {
							// this is a monitor process
							key = appPath.replace(/\//g, '');
							name = 'monitor';
							path = appPath;
						} else {
							// this is an application process
							key = processName.replace(/\//g, '');
							path = processName;
						}
						if (!processMap[key]) {
							processMap[key] = {
								monitor: [],
								app: [],
								path: path
							};
						}			
						processMap[key][name].push(lib.color(item.prefix, lib.COLORS.BROWN) + ' ' + lib.color(item.p, lib.COLORS.GREEN) + ' ' + lib.color('(pid:' + pid + ')', lib.COLORS.PURPLE));
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
		// output
		for (var path in processMap) {
			var p = processMap[path];
			console.log(lib.color('\n	To stop this application:', lib.COLORS.GRAY), lib.color('node daemon stop ' + p.path, lib.COLORS.LIGHT_BLUE));
			console.log(lib.color('	To restart this application:', lib.COLORS.GRAY), lib.color('node daemon restart ' + p.path, lib.COLORS.LIGHT_BLUE));
			console.log(p.monitor[0] || lib.color('	Daemon monitor process not running', lib.COLORS.GRAY));
			for (var i = 0, len = p.app.length; i < len; i++) {
				console.log(p.app[i]);	
			}
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

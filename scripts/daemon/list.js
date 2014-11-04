'use strict';

var exec = require('child_process').exec;
var gn = require('gracenode');
var async = require('async');
var lib = require('./utils/lib');

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
					// now find the process that the monitor is watching
					var path = list[i].substring(list[i].indexOf('start ') + 6).split(' ')[0];
					var execUser = list[i].substring(0, list[i].indexOf(' '));
					processList.push({ monitor: true, prefix: '	Daemon monitor process     :', p: trim(list[i]), app: path, user: execUser });
					continue;
				}
				if (list[i].indexOf(process.execPath) !== -1) {
					var p = trim(list[i]);
					var app = p.split(' ')[1];
					processList.push({ monitor: false, prefix: '		Application daemon process:', p: p, app: app });
				}
			}
			next();
		});
	};
	// get the list of pid and display
	var getPids = function (next) {
		exec('ps aux | pgrep node', function (error, stdout) {
			if (error) {
				return next(error);
			}
			var list = stdout.split('\n');
			for (var i = 0, len = processList.length; i < len; i++) {
				var item = processList[i];
				var key = item.app.replace(/\//g, '');
				var name = item.monitor ? 'monitor' : 'app';
				if (!processMap[key]) {
					processMap[key] = {
						monitor: [],
						app: [],
						user: null,
						path: item.app
					};
				}
				var prefix = lib.color(item.prefix, lib.COLORS.BROWN);
				var path = lib.color(item.p, lib.COLORS.GREEN);
				var pid = lib.color('(pid:' + list[i] + ')', lib.COLORS.PURPLE);
				processMap[key][name].push(prefix + ' ' + path + pid);
				if (!processMap[key].user && item.user) {
					processMap[key].user = item.user;
				}
			}
			next();
		});
	};
	// display process list along with pids
	var display = function (error) {
		if (error) {
			return gn.exit(error);
		}
		// output
		for (var path in processMap) {
			var p = processMap[path];
			if (!p.monitor[0]) {
				continue;
			}
			console.log(lib.color('\n	To stop this application   :', lib.COLORS.GRAY), lib.color('./daemon stop ' + p.path, lib.COLORS.LIGHT_BLUE));
			console.log(lib.color('	To restart this application:', lib.COLORS.GRAY), lib.color('./daemon restart ' + p.path, lib.COLORS.LIGHT_BLUE));
			console.log(lib.color('	Excecuted User             :', lib.COLORS.GRAY), lib.color(p.user, lib.COLORS.DARK_BLUE));
			console.log(p.monitor[0]);
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
	return str.substring(str.indexOf(process.execPath));
}

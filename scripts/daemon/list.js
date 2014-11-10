'use strict';

var fs = require('fs');
var gn = require('gracenode');
var async = require('async');
var lib = require('./utils/lib');
var talk = require('./utils/talk');

module.exports = function () {
	var apps = [];
	var appList = [];
	// get list of applications
	var getAppPaths = function (next) {
		fs.readdir('/tmp/', function (error, list) {
			if (error) {
				return next(error);
			}
			for (var i = 0, len = list.length; i < len; i++) {
				if (list[i].indexOf('gracenode-monitor-') === 0) {
					apps.push(list[i].replace('gracenode-monitor-', '').replace(/-/g, '/').replace('.sock', ''));
				}
			}
			next();
		});		
	};
	// find applications
	var findApps = function (next) {
		async.eachSeries(apps, function (app, moveOn) {
			talk.findApp(app, function (error, appProcess) {
				if (error) {
					return moveOn(error);
				}
				appList.push({ app: app, processes: appProcess });
				moveOn();
			});
		}, next);
	};
	// find pids
	var findPids = function (next) {
		async.eachSeries(appList, function (appInfo, moveOn) {
			talk.getPids(null, appInfo.processes, function (error, list) {
				if (error) {
					return moveOn(error);
				}
				console.log('');
				for (var i = 0, len = list.length; i < len; i++) {
					var app = lib.color(list[i].process.replace(process.execPath + ' ', ''), lib.COLORS.GREEN);
					var pid = lib.color('(' + list[i].pid + ')', lib.COLORS.PURPLE);
					var label = 'Application process	';
					if (app.indexOf('monitor start') !== -1) {
						label = 'Monitor process	';
					}
					console.log('	', lib.color(label, lib.COLORS.BROWN) + app, pid);
				}
				console.log('');
				moveOn();
			});
		}, next);
	};
	var done = function () {
		gn.exit();
	};
	// execute the commands
	async.series([
		getAppPaths,
		findApps,
		findPids
	], done);
};

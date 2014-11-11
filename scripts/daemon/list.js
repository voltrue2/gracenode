'use strict';

var fs = require('fs');
var exec = require('child_process').exec;
var gn = require('gracenode');
var async = require('async');
var lib = require('./utils/lib');
var talk = require('./utils/talk');

var TMP_PATH = '/tmp/';
var GN_MON = 'gracenode-monitor-';

module.exports = function () {
	var apps = [];
	var appList = [];
	// get list of applications
	var getAppPaths = function (next) {
		fs.readdir(TMP_PATH, function (error, list) {
			if (error) {
				return next(error);
			}
			async.each(list, function (file, moveOn) {
				if (file.indexOf(GN_MON) !== 0) {
					// not gracenode daemon sock
					return moveOn();
				}
				fs.stat(TMP_PATH + file, function (error, stats) {
					if (error) {
						return moveOn(error);
					}
					apps.push({
						uid: stats.uid,
						path: file.replace(GN_MON, '').replace(/-/g, '/').replace('.sock', '')
					});
					moveOn();
				});
			}, next);
		});		
	};
	// find owner user
	var findUserForApps = function (next) {
		async.eachSeries(apps, function (app, moveOn) {
			exec('awk -v val=' + app.uid + ' -F ":" \'$3==val{print $1}\' /etc/passwd', function (stderr, stdout) {
				app.user = stdout.replace(/\n/g, '');
				moveOn();
			});
		}, next);
	};
	// find applications
	var findApps = function (next) {
		async.eachSeries(apps, function (app, moveOn) {
			talk.findApp(app.path, function (error, appProcess) {
				if (error) {
					return moveOn(error);
				}
				appList.push({ uid: app.uid, user: app.user, app: app.path, processes: appProcess });
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
				console.log('	', lib.color('Application path	', lib.COLORS.BROWN), lib.color(appInfo.app, lib.COLORS.LIGHT_BLUE));
				console.log('	', lib.color('Executed user		', lib.COLORS.BROWN), lib.color(appInfo.user + '(uid:' + appInfo.uid + ')', lib.COLORS.LIGHT_BLUE));
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
		findUserForApps,
		findApps,
		findPids
	], done);
};

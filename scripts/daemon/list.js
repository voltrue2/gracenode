var fs = require('fs');
var exec = require('child_process').exec;
var gn = require('gracenode');
var async = require('async');
var lib = require('./utils/lib');
var sockName = require('./utils/socket-name');
var Status = require('./utils/status').Status;

module.exports = function () {
	// exception
	gn.on('uncaughtException', function () {
		gn.exit();
	});
	var apps = [];
	// get list of applications
	var getAppPaths = function (next) {
		var monPath = 'gracenode/scripts/daemon/monitor start ';
		var monPathLen = monPath.length;
		exec('ps aux | grep "' + monPath + '"', function (error, stdout) {
			if (error) {
				return next(error);
			}
			var list = stdout.split('\n');
			for (var i = 0, len = list.length; i < len; i++) {
				if (list[i].indexOf(process.execPath) !== -1) {
					apps.push({
						path: list[i].substring(list[i].lastIndexOf(monPath) + monPathLen).split(' ')[0]
					});
				}
			}
			next();
		});		
	};
	// find owner uid
	var findUidForApps = function (next) {
		async.each(apps, function (app, moveOn) {
			var path = sockName(app.path);
			fs.stat(path, function (error, stats) {
				if (error) {
					return moveOn(error);
				}
				app.uid = stats.uid;
				moveOn();
			});
		}, next);
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
	// find applications and their pids
	var findApps = function (next) {
		async.eachSeries(apps, function (appData, moveOn) {
			var status = new Status(appData.path);
			status.findProcessList(function (error, processList) {
				if (error) {
					return moveOn(error);
				}
				status.getPids(processList, function (error, list) {
					if (error) {
						return moveOn(error);
					}
					var commandLabel = lib.color(' Command		:', lib.COLORS.BROWN);
					var command = lib.color('./daemon (status|start|stop|restart|reload)', lib.COLORS.DARK_BLUE);
					var appPath = lib.color(appData.path, lib.COLORS.LIGHT_BLUE);
					var user = lib.color(appData.user + ' (uid:' + appData.uid + ')', lib.COLORS.LIGHT_BLUE);
					console.log('');
					console.log(lib.color(' Application path	:', lib.COLORS.BROWN), appPath);
					console.log(commandLabel, command, appPath);
					console.log(lib.color(' Executed user		:', lib.COLORS.BROWN), user);
					for (var i = 0, len = list.length; i < len; i++) {
						var app = lib.color(list[i].process.replace(process.execPath + ' ', ''), lib.COLORS.GREEN);
						var pid = lib.color('(' + list[i].pid + ')', lib.COLORS.PURPLE);
						var label = ' Application process	: ';
						if (app.indexOf('monitor start') !== -1) {
							label = ' Monitor process	: ';
						}
						console.log(lib.color(label, lib.COLORS.BROWN) + app, pid);
					}
					console.log('');
					moveOn();
				});
			});
		}, next);
	};
	var done = function () {
		gn.exit();
	};
	// execute the commands
	async.series([
		getAppPaths,
		findUidForApps,
		findUserForApps,
		findApps
	], done);
};

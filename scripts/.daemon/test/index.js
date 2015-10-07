var async = require('async');
var assert = require('assert');
var exec = require('child_process').exec;
var node = process.execPath;
var path = process.cwd() + '/node_modules/gracenode/scripts/daemon/';
var command = node + ' ' + path;
var app = path + 'test/test.js';

describe('Daemon tests ->', function () {

	it('Resets the test environment', function (done) {
		exec(command + ' stop ' + app, function () {
			done();
		});
	});

	it('Starts a daemon', function (done) {
		var start = function (next) {
			exec(command + ' start ' + app, function (err, out) {
				assert.equal(err, null);
				assert(out);
				next();
			});
		};
		var stat = function (next) {
			status(app, true, next);
		};
		var tasks = [
			start,
			stat
		];
		async.series(tasks, done);
	});

	it('Cannot start a daemon that is already running', function (done) {
		var start = function (next) {
			exec(command + ' start ' + app, function (err, out) {
				assert(err);
				assert.equal(out, '');
				next();
			});
		};
		var stat = function (next) {
			status(app, true, next);
		};
		var tasks = [
			start,
			stat
		];
		async.series(tasks, done);
	});

	it('Can restart a daemon that is running', function (done) {
		var sout1;
		var stat1 = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				sout1 = out;
				next();
			});
		};
		var restart = function (next) {
			exec(command + ' restart ' + app, function (err, out) {
				assert.equal(err, null);
				assert(out);
				next();
			});
		};
		var stat2 = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				assert.notEqual(sout1, out);
				next();				
			});
		};
		var tasks = [
			stat1,
			restart,
			stat2
		];
		async.series(tasks, done);
	});

	it('Can reload a daemon that is running', function (done) {
		var sout1;
		var stat1 = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				sout1 = out;
				next();
			});
		};
		var reload = function (next) {
			exec(command + ' reload ' + app, function (err, out) {
				assert.equal(err, null);
				assert(out);
				next();
			});
		};
		var stat2 = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				assert.notEqual(sout1, out);
				next();				
			});
		};
		var tasks = [
			stat1,
			reload,
			stat2
		];
		async.series(tasks, done);
	});

	it('Views the status of daemon that is running', function (done) {
		status(app, true, done);
	});

	it('Lists running daemon processes', function (done) {
		exec(command + ' list', function (err, out) {
			assert.equal(err, null);
			assert(out);
			done();
		});
	});
	/* TODO
	it('Can auto-restart killed daemon process', function (done) {
		var pid;
		var getPid = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				var list = out.split('\n');
				var masterLine;
				for (var i = 0, len = list.length; i < len; i++) {
					if (list[i].indexOf(' Daemon application process (master)') !== -1) {
						masterLine = list[i];
						break;
					}
				}	
				assert(masterLine);
				pid = masterLine.substring(masterLine.lastIndexOf('pid: ') + 1).replace(')', '');
				assert(pid);
				next();
			});
		};
		var kill = function (next) {
			exec('`kill -9 ' + pid + '`', function (err) {

				console.log(pid, err);

				assert.equal(err, null);
				next();
			});
		};
		var checkRestarted = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				var list = out.split('\n');
				var masterLine;
				for (var i = 0, len = list.length; i < len; i++) {
					if (list[i].indexOf(' Daemon application process (master)') !== -1) {
						masterLine = list[i];
						break;
					}
				}	
				assert(masterLine);
				var newPid = masterLine.substring(masterLine.lastIndexOf('pid: ') + 1).replace(')', '');
				assert.notEqual(newPid, pid);
				next();
			});

		};
		var tasks = [
			getPid,
			kill,
			checkRestarted
		];
		async.series(tasks, done);
	});
	*/
	it('Stops a daemon that is running', function (done) {
		var stop = function (next) {
			exec(command + ' stop ' + app, function (err, out) {
				assert.equal(err, null);
				assert(out);
				next();
			});
		};
		var stat = function (next) {
			status(app, false, next);
		};
		var tasks = [
			stop,
			stat
		];
		async.series(tasks, done);

	});

	it('Cannot stop a daemon that is not running', function (done) {
		var stop = function (next) {
			exec(command + ' stop ' + app, function (err, out) {
				assert(err);
				assert.equal(out, '');
				next();
			});
		};
		var stat = function (next) {
			status(app, false, next);
		};
		var tasks = [
			stop,
			stat
		];
		async.series(tasks, done);

	});

	it('Cannot view the satus of daemon that is not running', function (done) {
		status(app, false, done);
	});

	it('Cannot restart a daemon that is not running', function (done) {
		var sout1;
		var stat1 = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				sout1 = out;
				next();
			});
		};
		var restart = function (next) {
			exec(command + ' restart ' + app, function (err, out) {
				assert(err);
				assert.equal(out, '');
				next();
			});
		};
		var stat2 = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				assert.equal(sout1, out);
				next();				
			});
		};
		var tasks = [
			stat1,
			restart,
			stat2
		];
		async.series(tasks, done);
	});

	it('Cannot reload a daemon that is not running', function (done) {
		var sout1;
		var stat1 = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				sout1 = out;
				next();
			});
		};
		var reload = function (next) {
			exec(command + ' reload ' + app, function (err, out) {
				assert(err);
				assert.equal(out, '');
				next();
			});
		};
		var stat2 = function (next) {
			exec(command + ' status ' + app, function (err, out) {
				assert.equal(err, null);
				assert.equal(sout1, out);
				next();				
			});
		};
		var tasks = [
			stat1,
			reload,
			stat2
		];
		async.series(tasks, done);
	});

});

function status(app, mustBeRunning, cb) {
	exec(command + ' status ' + app, function (err, out) {
		if (mustBeRunning) {
			assert.equal(err, null);
			assert(out);
		} else {
			assert.equal(err, null);
			assert.equal(out, '');
		}
		cb();
	});
}

var async = require('async');
var assert = require('assert');
var exec = require('child_process').exec;
var path = __dirname + '/test.js';
var app = 'node ' + path;

describe('gracenode daemon', function () {

	it('resets the test environment', function (done) {
		exec(app + ' stop', function () {
			done();
		});
	});

	it('starts a daemon', function (done) {
		var start = function (next) {
			exec(app + ' start', function (err, out) {
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

	it('cannot start a daemon that is already running', function (done) {
		var start = function (next) {
			exec(app + ' start', function (err, out) {
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

	it('can restart a daemon that is running', function (done) {
		var sout1;
		var stat1 = function (next) {
			exec(app + ' status', function (err, out) {
				assert.equal(err, null);
				sout1 = out;
				next();
			});
		};
		var restart = function (next) {
			exec(app + ' restart', function (err, out) {
				assert.equal(err, null);
				assert(out);
				next();
			});
		};
		var stat2 = function (next) {
			exec(app + ' status', function (err, out) {
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

	it('can reload a daemon that is running', function (done) {
		var sout1;
		var stat1 = function (next) {
			exec(app + ' status', function (err, out) {
				assert.equal(err, null);
				sout1 = out;
				next();
			});
		};
		var reload = function (next) {
			exec(app + ' reload', function (err, out) {
				assert.equal(err, null);
				assert(out);
				next();
			});
		};
		var stat2 = function (next) {
			exec(app + ' status', function (err, out) {
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

	it('views the status of daemon that is running', function (done) {
		status(app, true, done);
	});

	it('Lists running daemon processes', function (done) {
		exec(app + ' list', function (err, out) {
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
	it('stops a daemon that is running', function (done) {
		var stop = function (next) {
			exec(app + ' stop', function (err, out) {
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

	it('cannot stop a daemon that is not running', function (done) {
		var stop = function (next) {
			exec(app + ' stop', function (err, out) {
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

	it('cannot view the satus of daemon that is not running', function (done) {
		status(app, false, done);
	});

	it('cannot restart a daemon that is not running', function (done) {
		var sout1;
		var stat1 = function (next) {
			exec(app + ' status', function (err, out) {
				assert.equal(err, null);
				sout1 = out;
				next();
			});
		};
		var restart = function (next) {
			exec(app + ' restart', function (err, out) {
				assert(err);
				assert.equal(out, '');
				next();
			});
		};
		var stat2 = function (next) {
			exec(app + ' status', function (err, out) {
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

	it('cannot reload a daemon that is not running', function (done) {
		var sout1;
		var stat1 = function (next) {
			exec(app + ' status', function (err, out) {
				assert.equal(err, null);
				sout1 = out;
				next();
			});
		};
		var reload = function (next) {
			exec(app + ' reload', function (err, out) {
				assert(err);
				assert.equal(out, '');
				next();
			});
		};
		var stat2 = function (next) {
			exec(app + ' status', function (err, out) {
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
	exec(app + ' status', function (err, out) {
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

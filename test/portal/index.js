const logEnabled = require('../arg')('--log');
const assert = require('assert');
const gn = require('../../src/gracenode');
const async = require('../../lib/async');
const exec = require('child_process').exec;
const Fs = require('./fs');
const LIST = [
	'one',
	'two',
	//'three'
];
const PROC = 'node ' + __dirname + '/';

function finish(done) {
	var t = setTimeout(function () {
		async.forEach(LIST, function (item, next) {
			exec(PROC + item + '.js stop', function () {
				next();
			});
		}, function () {
			throw new Error('Time Out!!!');
			process.exit(1);
		});
	}, 49900);
	return function () {
		clearTimeout(t);
		done();
	}
}

describe('gracenode.portal', function () {

	process.on('uncaughtException', function (error) {
		async.forEach(LIST, function (item, next) {
			exec(PROC + item + '.js stop', function () {
				next();
			});
		}, function () {
			process.exit(1);
		});
	});

	it('Can clean up BEFORE the tests', function (done) {
		async.forEach(LIST, function (item, next) {
			exec(PROC + item + '.js stop', function () {
				next();
			});
		}, finish(done));
	});
	
	it('Can start gracenode w/ portal enabled', function (done) {
		gn.config({
			log: {
				level: 'verbose >=',
				console: logEnabled,
				color: true
			},
			portal: {
				enable: true,
				type: 'test',
				address: '127.0.0.1',
				port: 9000,
				announce: {
					host: '127.0.0.1',
					port: 6379
				}
			}
		});
		gn.start(finish(done));
	});

	it('Can start test servers w/ portal enabled', function (done) {
		async.forEach(LIST, function (item, next) {
			exec(PROC + item + '.js start', function (error) {
				if (error) {
					console.log(error);
				}
				assert.equal(error, null);
				next();
			});
		}, finish(done));
	});

	it('Can poll and find file(s) from test servers', function (done) {
		var counter = 0;
		var finished = false;
		const INTERVAL = 1000;
		const fin = finish(done);
		const finalize = function () {
			if (finished) {
				return;
			}
			console.log('	checking finished:', counter + '/' + LIST.length);
			if (counter === LIST.length) {
				finished = true;
				return fin();
			}
			setTimeout(finalize, INTERVAL * (LIST.length - counter));
		};
		const poll = function (fs) {
			fs.read(function (error, data) {
				if (error) {
					setTimeout(function () {
						poll(fs);
					});
					return;
				}
				// two workers each (including locally handled)
				if (data.length < LIST.length * 2) {
					setTimeout(function () {
						poll(fs);
					});
					return;
				}
				counter += 1;
			});
		};
		for (var i = 0, len = LIST.length; i < len; i++) {
			console.log('	start polling:', LIST[i]);
			poll(new Fs(LIST[i]));
		}
		finalize();
	});

	it('Can wait for ' + (LIST.length * 2000) + 'ms', function (done) {
		setTimeout(done, LIST.length * 2000);
	});

	it('Can read all files from the test servers', function (done) {
		async.forEach(LIST, function (item, next) {
			const fs = new Fs(item);
			fs.read(function (error, data) {
				assert.equal(error, null);
				const group = {};
				var i;
				var len;
				for (i = 0, len = data.length; i < len; i++) {
					if (!group[data[i].by]) {
						group[data[i].by] = [];
					}
					group[data[i].by].push(data[i]);
				}
				var handledLocally = Object.keys(group).length;
				// two workers each (including locally handled)
				const procNum = (LIST.length * 2);
				const procSeen = [];
				const names = {};
				for (const name in group) {
					for (i = 0, len = group[name].length; i < len; i++) {
						if (name === group[name][i].from) {
							handledLocally -= 1;
						}
						if (procSeen.indexOf(group[name][i].from) === -1) {
							procSeen.push(group[name][i].from);
						}
						const nameType = group[name][i].from.split(':')[0];
						if (!names[nameType]) {
							names[nameType] = [];
						}
						if (names[nameType].indexOf(group[name][i].from) === -1) {
							names[nameType].push(group[name][i].from);
						}
					}
				}
				assert.equal(handledLocally, 0);
				assert.equal(procNum, procSeen.length);
				assert.equal(Object.keys(names).length, LIST.length);
				for (const type in names) {
					// two workers each
					assert.equal(names[type].length, 2);
				}
				next();
			});
		}, finish(done));
	});

	it('Can get nodes by type', function () {
		for (var i = 0, len = LIST.length; i < len; i++) {
			const nodes = gn.portal.getNodes(LIST[i]);
			// two workers each
			assert.equal(nodes.length, 2);
		}
	});

	it('Can stop all test servers w/ portal enabled', function (done) {
		async.forEach(LIST, function (item, next) {
			exec(PROC + item + '.js stop', function (error) {
				if (error) {
					console.error(error);
				}
				next();
			});
		}, finish(done));
	});

});

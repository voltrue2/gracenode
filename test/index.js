var gn = require('gracenode');
var prefix = require('./prefix');
var assert = require('assert');
var time = '2015-01-01 00:00:00.000';
var past = '2014-11-2 00:00:00.000';
var future = '2015-03-01 00:00:00.000';
var dayOffset = 60;
var hourOffset = 25;
var hourPast = '2014-12-30 23:00:00.000';
var hourFuture = '2015-01-02 01:00:00.000';

// gracenode main tests
describe('gracenode initialization ->', function () {
	
	it('Can load gracenode', function (done) {

		console.log('**NOTICE: This test requires async module installed in ../gracenode/node_modules/ to work properly');
	
		gn.setConfigPath(prefix + 'gracenode/test/configs/');
		gn.setConfigFiles(['setup.json']);

		gn.addModulePath(prefix + 'gracenode/test/modules/');

		// test external module use
		gn.use('test');

		// test externam module with hyphnes
		gn.use('test-me');

		// test driver
		gn.use('test-driver', { driver: gn.require(prefix + 'gracenode/test/drivers/test-driver') });

		// test 3rd party node module use with alternate name
		gn.use('async', { name: 'async2' });

		gn.use('async');

		gn.once('setup.config', function () {
			var sd = gn.config.getOne('modules.gracenode-staticdata');
			sd.path = prefix + sd.path;
			var sv = gn.config.getOne('modules.gracenode-server');
			sv.controllerPath = prefix + sv.controllerPath;
		});

		// test gracenode module use
		gn.use('gracenode-mysql');
		gn.use('gracenode-iap');
		gn.use('gracenode-staticdata');
		gn.use('gracenode-encrypt');
		gn.use('gracenode-cron');
		gn.use('gracenode-server');
		gn.use('gracenode-view');
		gn.use('gracenode-request');
		gn.use('gracenode-udp');
		gn.use('gracenode-session');
		gn.use('gracenode-wallet');
		gn.use('gracenode-memcache');

		// test prefix of log
		gn.on('setup.log', function () {
			gn.log.setPrefix('UNIT TEST');
		});

		gn.defineOption('-s', 'Option given from mocha', function (val) {
			var logger = gn.log.create();
			logger.debug('-s caught:', val);
		});

		gn.load(function (error) {
		
			assert.equal(error, null);

			done();
		});

	});

	it('Can gracefully unload loaded modules', function (done) {
		gn.unload(done);
	});

	it('Can start gracenode', function (done) {
		gn.start(function () {
			// test argv
			assert.equal(gn.argv('-s'), 10);
			assert.equal(gn.argv('-R'), 'spec');
			// test the rest
			assert(gn.encrypt.uuid);
			assert(gn.test.loaded());
			assert(gn.testMe);
			assert(gn.testDriver.test);
			assert(gn.async2);
			assert(gn.iap);
			assert(gn.mysql);
			assert(gn.staticdata.create);
			assert(gn.encrypt.uuid);
			assert(gn.cron.create);
			assert(gn.memcache.create);
			
			var logger = gn.log.create();
			logger.verbose('test');
			logger.debug('test');
			logger.trace('test');
			logger.info('test');
			logger.warn('test');
			logger.error('test');
			logger.fatal('test');
		
			done();

		});
			
	});

	it('Can clone objects with all properties', function () {
		var original = {
			a: 100,
			b: 'B',
			c: [1, 2, 3]
		};
		var cloned = gn.lib.cloneObj(original);
		assert.equal(original.a, cloned.a);
		assert.equal(original.b, cloned.b);
		assert.equal(JSON.stringify(original.c), JSON.stringify(cloned.c));
	});

	it('Can clone objects with selected properties', function () {
		var original = {
			a: 100,
			b: 'B',
			c: [1, 2, 3]
		};
		var cloned = gn.lib.cloneObj(original, ['a', 'b']);
		assert.equal(original.a, cloned.a);
		assert.equal(original.b, cloned.b);
		assert.equal(cloned.c, undefined);
	});

	it('Can dynamically set a configuration value', function () {
		gn.config.set('testConfig.bool', true);
		assert.equal(gn.config.getOne('testConfig.bool'), true);
	});

	it('Can dynamically set configuration values', function () {
		gn.config.set('testConfig.blah.1', 10000);
		assert.equal(gn.config.getOne('testConfig.blah.1'), 10000);
	});

	it('Can listen for an event of log module "output"', function (done) {
		gn.log.on('output', function (address, name, level, data) {
			assert(address);
			assert(name);
			assert(level);
			assert(data);
			if (level === 'fatal') {
				return done();
			}
		});

		var logger = gn.log.create();
		logger.verbose('verbose');	
		logger.debug('debug');	
		logger.trace('trace');	
		logger.info('info');	
		logger.warn('warn');	
		logger.error('error');	
		logger.fatal('fatal');
		var test = [
			{ name: 'Car', value: 1000, ident: 'car' },
			{ name: 'Spaceship', value: '日本語', ident: 'sp', fly: true },
			{ name: '大きなくま', value: 'a big bear', fly: false, alive: true },
			{ name: 'lalala lalalala foo', value: ['a', 'b', 'c']  }	
		];
		logger.table(test);
	});

	it('Can walk the whole directry tree', function (done) {
		gn.lib.walkDir(gn.getRootPath() + prefix + 'gracenode/test/dir/', function (error, list) {
			assert.equal(error, undefined);
			var logger = gn.log.create('lib module walkDir()');
			var path = gn.getRootPath() + prefix + 'gracenode/test/dir/';
			var fileNames = [
				path + 'one/1.txt',
				path + 'one/1.1.txt',
				path + 'one/one-one/1-1.txt',
				path + 'one/one-two/1-2.txt',
				path + 'two/2.txt',
				path + 'two/two-one/2-1.txt',
				path + 'two/two-two/2-2.txt',
				path + 'two/two-two/two-two-one/2-2-1.txt',
				path + 'two/two-three/two-three-one/two-three-one-one/2-3-1-1.txt'
			];
			for (var i = 0, len = list.length; i < len; i++) {
				logger.verbose(list[i].file);
				assert.notEqual(fileNames.indexOf(list[i].file), -1);
			}
			assert.equal(i, fileNames.length);
			done();
		});
	});

	it('Can log with default log name', function (done) {
		var logTest = require(gn.getRootPath() + prefix + 'gracenode/test/log-test/more/log-caller/');
		logTest.log();
		done();
	});

	it('Can find a matched element and its index from an array', function () {
		var list = ['a', 'b', 'c'];
		var res = gn.lib.find(list, function (elm) {
			return elm === 'b';
		});
		assert.equal(res[0].index, 1);
		assert.equal(res[0].element, 'b');
	});

	it('Can find a matched element and its key from an object', function () {
		var map = {
			a: 100,
			b: 200,
			c: 300
		};
		var res = gn.lib.find(map, function (item) {
			return item === 100;
		});
		assert.equal(res[0].index, 'a');
		assert.equal(res[0].element, 100);
	});

	it('Can find matched elements and their indexes from an array', function () {
		var list = ['a', 'b', 'c'];
		var res = gn.lib.find(list, function (elm) {
			return elm === 'a' || 'b';
		});
		assert.equal(res[0].index, 0);
		assert.equal(res[0].element, 'a');
		assert.equal(res[1].index, 1);
		assert.equal(res[1].element, 'b');
	});

	it('Can find matched elements and their keys from an object', function () {
		var map = {
			a: 100,
			b: 200,
			c: 300
		};
		var res = gn.lib.find(map, function (item) {
			return item === 100 || item === 300;
		});
		assert.equal(res[0].index, 'a');
		assert.equal(res[0].element, 100);
		assert.equal(res[1].index, 'c');
		assert.equal(res[1].element, 300);
	});

	it('Can return an empty array if there is no matched element in the given array', function () {
		var list = ['a', 'b', 'c'];
		var res = gn.lib.find(list, function (elm) {
			return elm === 'd';
		});
		assert.equal(res.length, 0);
	});

	it('Can return an empty array if there is no matched element in the given object', function () {
		var map = {
			a: 100,
			b: 200,
			c: 300
		};
		var res = gn.lib.find(map, function (item) {
			return item === 400;
		});
		assert.equal(res.length, 0);
	});

	it('Can create an increment type timed data', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'inc'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);
	});

	it('Can not create an increment type timed data w/ invalid init', function () {
		var conf = {
			init: '10',
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'inc'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an increment type timed data w/ invalid max', function () {
		var conf = {
			init: 10,
			max: 0,
			min: 0,
			interval: 10,
			step: 1,
			type: 'inc'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an increment type timed data w/ invalid min', function () {
		var conf = {
			init: 10,
			max: 10,
			min: -1,
			interval: 10,
			step: 1,
			type: 'inc'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an increment type timed data w/ invalid interval', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: [1, 2, 3],
			step: 1,
			type: 'inc'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an increment type timed data w/ invalid step', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 100,
			type: 'inc'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an increment type timed data w/ invalid type', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'foo'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can create an increment type timed data and decrement', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'inc'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);

		var success = timedData.dec(5);

		assert.equal(success, true);
		assert.equal(timedData.getValue(), 5);
	});

	it('Can create an increment type timed data and cannot decrement beyond min', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'inc'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);

		var success = timedData.dec(100);

		assert.equal(success, false);
		assert.equal(timedData.getValue(), 10);
	});

	it('Can create an increment type timed data and decrement and recover by 1 after 10 milliseconds', function (done) {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'inc'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);

		var success = timedData.dec(5);

		assert.equal(success, true);
		assert.equal(timedData.getValue(), 5);

		setTimeout(function () {
			assert.equal(timedData.getValue(), 6);
			done();
		}, 10);
	});

	it('Can create an increment type timed data and decrement and recover by 5 after 50 milliseconds', function (done) {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'inc'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);

		var success = timedData.dec(5);

		assert.equal(success, true);
		assert.equal(timedData.getValue(), 5);

		setTimeout(function () {
			assert.equal(timedData.getValue(), 10);
			done();
		}, 50);
	});

	it('Can create an increment type timed data and decrement and cannot recover beyond max after 60 milliseconds', function (done) {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'inc'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);

		var success = timedData.dec(5);

		assert.equal(success, true);
		assert.equal(timedData.getValue(), 5);

		setTimeout(function () {
			assert.equal(timedData.getValue(), 10);
			done();
		}, 60);
	});

	it('Can create an decrement type timed data', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'dec'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);
	});

	it('Can not create an decrement type timed data w/ invalid init', function () {
		var conf = {
			init: '10',
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'dec'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an deccrement type timed data w/ invalid max', function () {
		var conf = {
			init: 10,
			max: 0,
			min: 0,
			interval: 10,
			step: 1,
			type: 'dec'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an increment type timed data w/ invalid min', function () {
		var conf = {
			init: 10,
			max: 10,
			min: -1,
			interval: 10,
			step: 1,
			type: 'dec'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an decrement type timed data w/ invalid interval', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: [1, 2, 3],
			step: 1,
			type: 'dec'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an decrement type timed data w/ invalid step', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 100,
			type: 'dec'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can not create an decrement type timed data w/ invalid type', function () {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'foo'
		};
		try {
			gn.lib.createTimedData(conf);
		} catch (e) {
			assert(e);
		}
	});

	it('Can create an decrement type timed data and increment', function () {
		var conf = {
			init: 9,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'dec'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 9);

		var success = timedData.inc(1);

		assert.equal(success, true);
		assert.equal(timedData.getValue(), 10);
	});

	it('Can create an decrement type timed data and cannot increment beyond max', function () {
		var conf = {
			init: 9,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'dec'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 9);

		var success = timedData.inc(100);

		assert.equal(success, false);
		assert.equal(timedData.getValue(), 9);
	});

	it('Can create an decrement type timed data by 1 after 10 milliseconds', function (done) {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'dec'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);

		setTimeout(function () {
			assert.equal(timedData.getValue(), 9);
			done();
		}, 10);
	});

	it('Can create an decrement type timed data and decrement and derecements by 5 after 50 milliseconds', function (done) {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'dec'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);

		var success = timedData.dec(5);

		assert.equal(success, true);
		assert.equal(timedData.getValue(), 5);

		setTimeout(function () {
			assert.equal(timedData.getValue(), 0);
			done();
		}, 50);
	});

	it('Can create an decrement type timed data and decrement and cannot decrement beyond min after 60 milliseconds', function (done) {
		var conf = {
			init: 10,
			max: 10,
			min: 0,
			interval: 10,
			step: 1,
			type: 'dec'
		};
		var timedData = gn.lib.createTimedData(conf);
		var value = timedData.getValue();
		
		assert.equal(value, 10);

		var success = timedData.dec(5);

		assert.equal(success, true);
		assert.equal(timedData.getValue(), 5);

		setTimeout(function () {
			assert.equal(timedData.getValue(), 0);
			done();
		}, 60);
	});

	it('Can pad number with leading 0', function () {
		var paddedOne = gn.lib.padNumber(1);
		var paddedNine = gn.lib.padNumber(9);
		var justTen = gn.lib.padNumber(10);
		assert.equal(paddedOne, '01');
		assert.equal(paddedNine, '09');
		assert.equal(justTen, '10');
		assert.equal(gn.lib.padNumber(10, 3), '010');
		assert.equal(gn.lib.padNumber(99, 3), '099');
		assert.equal(gn.lib.padNumber(100, 3), '100');
	});

	it('Can get an array of date objects between 2015/04/12 and 2015/04/22', function () {
		var start = new Date('2015-04-12');
		var end = new Date('2015-05-12');
		var list = gn.lib.getDates(start, end);
		for (var i = 0, len = list.length; i < len; i++) {
			var day = list[i];
			var check = new Date('2015-04-12');
			check.setDate(check.getDate() + i);
			assert.equal(day.getFullYear(), check.getFullYear());
			assert.equal(day.getMonth() + 1, check.getMonth() + 1);
			assert.equal(day.getDate(), check.getDate());
		}
	});

	it('Can create gn.lib.createDateTime object with no argument passed', function () {
		var d = gn.lib.createDateTime();
		assert(d);
	});

	it('Can return timestamp in milliseconds', function () {
		var then = new Date(time).getTime();
		var d = gn.lib.createDateTime(time);
		assert.equal(then, d.now());
	});

	it('Can format Y-m-d H:M:S.N', function () {
		var d = gn.lib.createDateTime(time);
		var f = d.format('Y-m-d H:M:S.N');
		assert.equal(f, time);
	});

	it('Can format Y-m-d I:M:S.N', function () {
		var str = '2015-05-01 04:30:00.666';
		var d = gn.lib.createDateTime(str);
		var f = d.format('Y-m-d I:M:S.N');
		assert.equal(str, f);
	});

	it('Can return y/m/d', function () {
		var d = gn.lib.createDateTime(time);
		var f = d.format('y/m/d');
		assert.equal(f, '15/01/01');
	});

	it('Can return name of week', function () {
		var d = gn.lib.createDateTime(time);
		var f = d.format('w W');
		assert.equal('Thu Thursday', f);
	});

	it('Can return a short name of a month', function () {
		var d = gn.lib.createDateTime(time);
		var m = d.format('n');
		assert.equal('Jan', m);
	});

	it('Can return a full name of a month', function () {
		var d = gn.lib.createDateTime(time);
		var m = d.format('f');
		assert.equal('January', m);
	});

	it('Can offset ' + dayOffset + ' days in the past', function () {
		var d = gn.lib.createDateTime(time);
		d.offsetInDays(-1 * dayOffset);
		assert(past, d.format('Y-m-d H:M:S.N'));
	});

	it('Can offset ' + dayOffset + ' days in the future', function () {
		var d = gn.lib.createDateTime(time);
		d.offsetInDays(dayOffset);
		assert(future, d.format('Y-m-d H:M:S.N'));
	});

	it('Can offset ' + hourOffset + ' hours in the past', function () {
		var d = gn.lib.createDateTime(time);
		d.offsetInHours(-1 * hourOffset);
		assert.equal(d.format('Y-m-d H:M:S.N'), hourPast);
	});

	it('Can offset ' + hourOffset + ' hours in the future', function () {
		var d = gn.lib.createDateTime(time);
		d.offsetInHours(hourOffset);
		assert.equal(d.format('Y-m-d H:M:S.N'), hourFuture);
	});

	it('Can get instances of DateTime object between 2015-04-12 and 2015-05-12', function () {
		var start = gn.lib.createDateTime('2015-04-12');
		var end = gn.lib.createDateTime('2015-05-12');
		var format = 'Y-m-d H:M:S.N';
		var list = start.getDatesInRange(end);
		for (var i = 0, len = list.length; i < len; i++) {
			var day = list[i];
			var check = gn.lib.createDateTime(start.now());
			check.offsetInDays(i);
			assert.equal(day.format(format), check.format(format));
		}
	});

	it('Can get instances of DateTime object between 2015-05-12 and 2015-04-12', function () {
		var start = gn.lib.createDateTime('2015-04-12');
		var end = gn.lib.createDateTime('2015-05-12');
		var format = 'Y-m-d H:M:S.N';
		var list = start.getDatesInRange(end);
		for (var i = list.length - 1; i >= 0; i--) {
			var day = list[i];
			var check = gn.lib.createDateTime(start.now());
			check.offsetInDays(i);
			assert.equal(day.format(format), check.format(format));
		}
	});

	it('Can use default format', function () {
		var dateStr = '2015-04-30 11:59:59.999';
		var dt = gn.lib.createDateTime(dateStr, 'Y-m-d H:M:S.N');
		assert.equal(dateStr, dt.format());
	});
 
});

// gracenode daemon tool tests
require('../scripts/daemon/test/');

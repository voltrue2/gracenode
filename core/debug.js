'use strict';

var async = require('async');
var jshintcli = require('jshint/src/cli');
var lib = require('../modules/lib');
var gn;
var memHistory = [];

// keeps memory usage record for up to 1 hour
var MEMHISTORY_LEN = 360;
// checks memory usage every 10 seconds
var MEMWATCH_INTERVAL = 10000;

module.exports.setup = function (gracenode) {
	gn = gracenode;
};

module.exports.exec = function (cb) {
	var config = gn.config.getOne('debugMode');
	if (!config) {
		// not in debug mode
		return cb();
	}
	
	var logger = gn.log.create('debug-mode');

	logger.debug('running the application in DEBUG MODE');

	logger.debug('memory monitoring started');

	startMemWatch(config, logger);

	if (!config.directories) {
		config.directories = [];
	}
	
	var options = {};
	var errors = [];

	// apply jshint options if given
	if (config.lintOptions) {
		options.config = config.lintOptions;
		logger.debug('jshint options used:', options.config);
	}

	// set up a lint result reporter function
	options.reporter = function (results) {
		for (var i = 0, len = results.length; i < len; i++) {
			var res = results[i];
			if (res.error) {
				errors.push(res);
			}
		}
	};	

	// done function to be called at the end of all linting
	var done = function (error) {
		if (error) {
			return cb(error);
		}
		if (errors.length) {
			var erroredFiles = [];
			for (var i = 0, len = errors.length; i < len; i++) {
				if (erroredFiles.indexOf(errors[i].file) === -1) {
					erroredFiles.push(errors[i].file);
				}
				var msg = 'lint error in [' + errors[i].file + ']';
				msg += ' Line ' + errors[i].error.line;
				msg += ' Character ' + errors[i].error.character;
				msg += ' ' + errors[i].error.reason;
				logger.error(msg);
			}
			logger.error(errors.length, 'lint error(s) found in', erroredFiles.length, 'files');
			return cb(new Error('lintError'));
		}
		// we are lint error free
		logger.debug('lint [DONE]: no lint error found');
		cb();
	};

	// walk all given directories to lint
	async.eachSeries(config.directories, function (item, next) {
		var path = gn.getRootPath() + item;
		lib.walkDir(path, function (error, files) {
			if (error) {
				return next(error);
			}
			// find javascript files only to lint
			var list = [];
			for (var i = 0, len = files.length; i < len; i++) {
				var file = files[i].file;
				if (file.substring(file.lastIndexOf('.') + 1) !== 'js') {
					// not a javascript file
					continue;
				}
				list.push(file);
				logger.debug('lint:', file);
			}
			options.args = list;
			jshintcli.run(options);
			next();
		});
	}, done);
};

function startMemWatch(config, logger) {
	setTimeout(function () {
		var usage = process.memoryUsage();
		if (memHistory.length === MEMHISTORY_LEN) {
			// discard the oldest memory record
			memHistory.shift();
		}
		memHistory.push(usage);
		var avgUsed = 0;
		for (var i = 0, len = memHistory.length; i < len; i++) {
			avgUsed += memHistory[i].heapUsed;
		}
		var avg = avgUsed / memHistory.length;
		var usedPercentage = ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2);
		var diffPercentage = ((((usage.heapUsed / avg) * 100) - 100).toFixed(2));
		// output the analysis
		logger.debug('memory RSS(resident set size):', bytesToSize(usage.rss));
		logger.debug('memory heap used:', bytesToSize(usage.heapUsed),  usedPercentage + '%');
		logger.debug('memory heap used average:', bytesToSize(avg), '(used difference:', diffPercentage + '%)');
		logger.debug('memory heap total:', bytesToSize(usage.heapTotal));
		if (usedPercentage >= 80) {
			logger.debug('***WARNING: memory heap usage is too close to heap total');
		}
		if (diffPercentage >= 50) {
			logger.debug('***WARNING: sudden jump in memory heap used detected');
		}
		// run this in MEMWATCH_INTERVAL seconds again
		startMemWatch(config, logger);
	}, MEMWATCH_INTERVAL);
}

function bytesToSize(bytes) {
	if (bytes === 0) {
		return '0 Byte';
	}
	var k = 1000;
	var sizes = [
		'Bytes',
		'KB',
		'MB',
		'GB',
		'TB',
		'PB',
		'EB',
		'ZB',
		'YB'
	];
	var size = Math.floor(Math.log(bytes) / Math.log(k));
	return (bytes / Math.pow(k, size)).toPrecision(3) + ' ' + sizes[size];
}

var async = require('async');
var fs = require('fs');
var jshint = require('jshint').JSHINT;
var lib = require('../modules/lib');
var gn;

module.exports.setup = function (gracenode) {
	gn = gracenode;
};

module.exports.exec = function (cb) {
	var config = gn.config.getOne('debugMode');
	if (!config || !config.directories || !config.directories.length) {
		// not in debug mode
		return cb();
	}
	var logger = gn.log.create('debug-mode');
	var list = [];
	var getAllFiles = function (next) {
		logger.debug('running the application in debug mode...');
		async.eachSeries(config.directories, function (item, done) {
			var path = gn.getRootPath() + item;
			logger.debug('extract files to be linted:', path);
			lib.walkDir(path, function (error, files) {
				if (error) {
					return done(error);
				}
				list = list.concat(files);
				done();
			});
		}, next);
	};
	var lint = function (next) {
		logger.debug('start linting the application files...');
		async.eachSeries(list, function (item, done) {
			var file = item.file;
			// exclude everything except for javascript files
			if (file.substring(file.lastIndexOf('.') + 1) !== 'js') {
				return done();
			}
			// lint
			logger.debug('liniting:', file);
			fs.readFile(file, 'utf8', function (error, data) {
				if (error) {
					return done(error);
				}
				if (!jshint(data)) {
					var errors = jshint.data().errors;
					var hasError = false;
					for (var i = 0, len = errors.length; i < len; i++) {
						var err = errors[i];
						var isWarning = err.code.substring(0, 1) === 'W' ? true : false;
						if (isWarning) {
							logger.warn('lint warning: Line', err.line, 'Character', err.character, err.reason);
						} else {
							hasError = true;
							logger.error('lint error: Line', err.line, 'Character', err.character, err.reason);
						}
					}
					if (hasError) {
						return done(new Error('lintError'));
					}
				}
				// no lint error
				done();
			});
		}, next);
	};
	async.series([
		getAllFiles,
		lint
	], cb);
};

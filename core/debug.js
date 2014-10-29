var async = require('async');
var jshintcli = require('jshint/src/cli');
var lib = require('../modules/lib');
var gn;
var lintOptions = null;

module.exports.setup = function (gracenode) {
	gn = gracenode;
};

module.exports.exec = function (cb) {
	var config = gn.config.getOne('debugMode');
	if (!config || !config.directories || !config.directories.length) {
		// not in debug mode
		return cb();
	}
	// apply jshint options if given
	if (config.lintOptions) {
		lintOptions = config.lintOptions;
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
		var options = {};
		var hasError = false;
		if (lintOptions) {
			options.config = lintOptions;
		}
		options.args = list.map(function (item) {
			return item.file;
		});
		options.reporter = function (results) {
			for (var i = 0, len = results.length; i < len; i++) {
				var res = results[i];
				if (res.error) {
					hasError = true;	
					logger.error('lint error found in:', res.file);
					logger.error('	lint error: Line', res.error.line, 'Character', res.error.character, res.error.reason);
				}
			}
		};
		logger.debug('start linting...');
		jshintcli.run(options);
		next(hasError ? new Error('lintError') : null);
	};
	async.series([
		getAllFiles,
		lint
	], cb);
};

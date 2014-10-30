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
	
	var logger = gn.log.create('debug-mode');

	logger.debug('running the application in DEBUG MODE');
	
	//var list = [];
	var options = {};
	var errors = [];

	// apply jshint options if given
	if (config.lintOptions) {
		options.config = config.lintOptions;
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
			for (var i = 0, len = errors.length; i < len; i++) {
				var msg = 'lint error in [' + errors[i].file + ']';
				msg += ' Line ' + errors[i].error.line;
				msg += ' Character ' + errors[i].error.character;
				msg += ' ' + errors[i].error.reason;
				logger.error(msg);
			}
			return cb(new Error('lintError'));
		}
		// we are lint error free
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

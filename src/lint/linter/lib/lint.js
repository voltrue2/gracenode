'use strict';

var async = require('async');
var jshintcli = require('jshint/src/cli');
var progressbar = require('./progressbar');
var print = require('./print');
var files = require('./files');

function Lint(files, ignorelist) {
	var that = this;
	this._pb = null;
	this._list = Array.isArray(files) ? files : [files];
	this._files = [];
	this._ignorelist = ignorelist || [];
	this._errors = [];
	this._opt = {};
	this._opt.reporter = function (results) {
		that._reporter(results);
	};

	print.useColor();
}

Lint.prototype.run = function (cb) {
	var that = this;
	var tasks = [
		function (next) {
			that._prepare(next);
		},
		function (next) {
			that._validate(next);
		},
		function (next) {
			that._reportResults(next);
		}
	];
	async.series(tasks, cb);
};

Lint.prototype._reporter = function (results) {
	for (var i = 0, len = results.length; i < len; i++) {
		var res = results[i];
		if (res.error) {
			this._errors.push(res);
		}
	}
};

Lint.prototype._prepare = function (cb) {
	var that = this;
	var done = function (error) {
		if (error) {
			return cb(error);
		}
		that._files = that._files.filter(function (item) {
			for (var i = 0, len = that._ignorelist.length; i < len; i++) {
				var ignore = that._ignorelist[i];
				if (item.indexOf(ignore) !== -1) {
					// ignore
					print.verbose('Ignore to lint:' + item);
					return false;
				}
			}
			var ext = item.substring(item.lastIndexOf('.') + 1);
			return ext === 'js';
		});
	
		print.out('\nFiles to lint:\n' + print.b(that._files.join('\n')));

		var options = {
			color: progressbar.COLORS.GRAY,
			label: 'Linting JavaScript:'
		};
		that._pb = new progressbar.Progressbar(that._files.length, options);
		that._pb.start();
		cb();
	};
	
	async.forEach(this._list, function (path, next) {
		files.walkDir(path, function (error, list) {
			if (error) {
				return next(error);
			}

			list = list.map(function (item) {
				return item.file;
			});
			that._files = that._files.concat(list);
			next();
		});
	}, done);
};

Lint.prototype._validate = function (cb) {
	var that = this;
	async.forEach(this._files, function (item, next) {
		that._opt.args = [item];
		jshintcli.run(that._opt);
		that._pb.update();
		next();
	}, cb);
};

Lint.prototype._reportResults = function (cb) {

	var errorCount = 0;
	var errorFiles = [];

	this._pb.end();
	
	for (var i = 0, len = this._errors.length; i < len; i++) {
		var eitem = this._errors[i];
		var msg = eitem.file;
		msg += ' <Line ' + eitem.error.line + '>';
		msg += ' [Character ' + eitem.error.character + ']';
		msg += ' ' + eitem.error.reason;
		print.error('[ ' + print.r('!') + ' ] ' + print.r(msg));

		errorCount += 1;

		if (errorFiles.indexOf(eitem.file) === -1) {
			errorFiles.push(eitem.file);
		}
	}

	for (var j = 0, jen = this._files.length; j < jen; j++) {
		if (errorFiles.indexOf(this._files[j]) === -1) {
			print.out('[ ' + print.g('✓') + ' ] ' + print.g(this._files[j]));
		}
	}
	
	if (this._errors.length) {
		var ef = 'file';
		var ne = 'error';
		if (errorFiles.length > 1) {
			ef += 's';
		}
		if (errorCount > 1) {
			ne += 's';
		}
		print.error(
			print.r(
				'\nLint Error(s):' +
				' ' + errorFiles.length + ' ' + ef +
				' ' + errorCount + ' ' + ne +
				' [Total: ' + errorFiles.length +
				' error ' + ef +  ' out of ' + this._files.length +
				' ' + ef + ']' +
				'\n' +
				'If you need to disable linting on gracenode.start(), add the following to your configurations: { lint: { enable: false } }'
			)
		);
		return cb(new Error('LintError'));
	}

	print.out('\nLint [' + print.g(' DONE ') + ']\n');
	cb();
};

exports.Lint = Lint;

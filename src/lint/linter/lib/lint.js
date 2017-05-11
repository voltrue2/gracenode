'use strict';

var async = require('async');
var jshintcli = require('jshint/src/cli');
var print = require('./print');
var files = require('./files');

function Lint(files, ignorelist) {
	var that = this;
	this._list = Array.isArray(files) ? files : [files];
	this._files = [];
	this._ignorelist = ignorelist || [];
	this._errors = [];
	this._opt = {};
	this._opt.reporter = function __lintLinterLintReporter(results) {
		that._reporter(results);
	};
	print.setup();
	print.useColor();
}

Lint.prototype.run = function __lintLinterLintRun(cb) {
	var that = this;
	var tasks = [
		function __lintLinterRunPrep(next) {
			that._prepare(next);
		},
		function __lintLinterRunValidate(next) {
			that._validate(next);
		},
		function __lintLinterRunReport(next) {
			that._reportResults(next);
		}
	];
	async.series(tasks, cb);
};

Lint.prototype._reporter = function __lintLinterLintReporter(results) {
	for (var i = 0, len = results.length; i < len; i++) {
		var res = results[i];
		if (res.error) {
			this._errors.push(res);
		}
	}
};

Lint.prototype._prepare = function __lintLinterPrepare(cb) {
	var that = this;
	var done = function __lintLinterPrepareDone(error) {
		if (error) {
			return cb(error);
		}
		that._files = that._files.filter(function __lintLinterPrepareFile(item) {
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

		cb();
	};
	
	async.forEach(this._list, function __lintLinterPrepareEach(path, next) {
		files.walkDir(path, function __lintLinterPrepareWalkDirRes(error, list) {
			if (error) {
				return next(error);
			}

			list = list.map(function __lintLinterPrepareListMap(item) {
				return item.file;
			});
			that._files = that._files.concat(list);
			next();
		});
	}, done);
};

Lint.prototype._validate = function __lintLinterValidate(cb) {
	var that = this;
	async.forEach(this._files, function __lintLinterValidateEach(item, next) {
		that._opt.args = [item];
		jshintcli.run(that._opt);
		next();
	}, cb);
};

Lint.prototype._reportResults = function __lintLinterReportRes(cb) {

	var errorCount = 0;
	var errorFiles = [];
	var errorMsgList = [];
	
	for (var i = 0, len = this._errors.length; i < len; i++) {
		var eitem = this._errors[i];
		var msg = eitem.file;
		msg += ' <Line ' + eitem.error.line + '>';
		msg += ' [Character ' + eitem.error.character + ']';
		msg += ' ' + eitem.error.reason;
		errorMsgList.push('[ ! ] ' + msg);

		errorCount += 1;

		if (errorFiles.indexOf(eitem.file) === -1) {
			errorFiles.push(eitem.file);
		}
	}

	var linted = [];
	for (var j = 0, jen = this._files.length; j < jen; j++) {
		if (errorFiles.indexOf(this._files[j]) === -1) {
			linted.push(print.n('[ ') + print.g('✓') + print.n(' ] ') + print.g(this._files[j]));
		} else {
			linted.push(print.n('[ ') + print.r('×') + print.n(' ] ') + print.r(this._files[j]));
		}
	}
	print.out('Linted Files:\n' + linted.join('\n'));
	
	if (this._errors.length) {
		var ef = 'file';
		var ne = 'error';
		if (errorFiles.length > 1) {
			ef += 's';
		}
		if (errorCount > 1) {
			ne += 's';
		}
		print.error(print.r('\n' + errorMsgList.join('\n')));
		print.error(
			print.r(
				'\nLint Error(s):' +
				' ' + errorFiles.length + ' ' + ef +
				' ' + errorCount + ' ' + ne +
				' [Total: ' + errorFiles.length +
				' error ' + ef +  ' out of ' + this._files.length +
				' ' + ef + ']' +
				'\n\n' + '********** [Hint] **********' + '\n' +
				'If you need to disable linting on gracenode.start(), ' + '\n' +
				'add the following to your configurations: { lint: { enable: false } }' +
				'\n' + '****************************' + '\n'
			)
		);
		return cb(new Error('LintError'));
	}

	print.out(
		print.n('Lint ') + this._files.length +
		print.n(' files [') + print.g(' DONE ') + print.n(']')
	);
	cb();
};

exports.Lint = Lint;

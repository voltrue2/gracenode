// --help is automatically defined and reserved
var HELP = '--help';
var helpText;
var argKeys = [];
var defKeys = [];
var exitOnBadOption = false;

function Argv(gn) {
	this._gn = gn;
	this._argv = {};	
	this._def = {};
	this._maxLen = 0;
}

module.exports = Argv;

// if this is set, the application process will exit on either bad option or no option given
Argv.prototype.exitOnBadOption = function () {
	exitOnBadOption = true;
};

Argv.prototype.parse = function () {
	var prev = null;
	var lib = require(this._gn._root + 'modules/lib');
	// first element is the path of node
	// second element is the path of app
	for (var i = 2, len = process.argv.length; i < len; i++) {
		var arg = process.argv[i];
		if (arg.indexOf('=') !== -1) {
			// format: --name=value
			var sep = arg.split('=');
			this._argv[sep[0]] = lib.typeCast(sep[1]);
			argKeys.push(sep[0]);
			continue;
		}
		if (prev && (arg.indexOf('-') !== 0 || !isNaN(arg))) {
			// format: -name value
			if (this._argv[prev] === true) {
				this._argv[prev] = [];
			}
			this._argv[prev].push(lib.typeCast(arg));
			continue;
		}
		// format: -argument or -argument value that is NOT a number: for example -5 is a number, so not considered an option
		this._argv[arg] = true;
		argKeys.push(arg);
		prev = arg;
	}
};

Argv.prototype.setup = function () {
	// check if --help option is present or not
	var help = this.get(HELP);
	if (help) {
		return this._showHelp();
	}
};

Argv.prototype.get = function (arg) {
	// -- format:
	if (arg.indexOf('--') === 0) {
		return this._argv[arg] || null;
	}
	if (arg.indexOf('-') === 0) {
		// - format -> this format supports combining multiple options: -abc is a combination of -a, -b, and -c
		arg = arg.replace('-', '');
		for (var i = 0, len = argKeys.length; i < len; i++) {
			var key = argKeys[i];
			if (key.indexOf('--') !== 0 && key.indexOf('-') === 0 && key.indexOf(arg) !== -1) {
				var values = this._argv[key];
				if (values.length === 1) {
					return values[0];
				}
				return values;
			}
		}
	}
	// no hyphnes
	return this._argv[arg] || null;
};

Argv.prototype.setHelpText = function (text) {
	helpText = text;	
};

Argv.prototype.defineOption = function (arg, desc, argAsArray, cb) {
	if (!Array.isArray(arg)) {
		arg = [arg];
	}
	for (var i = 0, len = arg.length; i < len; i++) {
		if (this._def[arg[i]]) {
			throw new Error('Cannot define a handler function for the same arguement more than once: argument [' + arg[i] + ']');
		}
		if (typeof argAsArray === 'function' && !cb) {
			cb = argAsArray;
			argAsArray = true;
		}
		this._def[arg[i]] = { desc: desc, callback: cb, argAsArray: argAsArray };
		if (defKeys.indexOf(arg[i]) === -1) {
			defKeys.push(arg[i]);
		}
		if (arg[i].length > this._maxLen) {
			this._maxLen = arg[i].length;
		}
	}
};

Argv.prototype.execDefinedOptions = function () {
	var optionCalled = 0;
	for (var i = 0, len = defKeys.length; i < len; i++) {
		var arg = defKeys[i];
		var option = this.get(arg);
		if (option && typeof this._def[arg].callback === 'function') {
			optionCalled += 1;
			var def = this._def[arg];
			if (def.argAsArray) {
				def.callback(option);
			} else {
				def.callback.apply(null, option);
			}
		}
	}
	// check for exitOnBadOption
	if (exitOnBadOption && !optionCalled) {
		var error = 0;
		var args = Object.keys(this._argv);
		if (!args.length) {
			error = new Error('No option(s) given');
		} else {
			error = new Error('Unkown option(s): ' + args.join(', ') + ' given');
		}
		this._showHelp(error);
	}
};

Argv.prototype._showHelp = function (error) {
	var pkg = require('../package.json');
	var help = '';
	var author = '';

	if (!pkg.author) {
		author = 'N/A';
	} else if (typeof pkg.author === 'object') {
		author = JSON.stringify(pkg.author, null, 2);
	}

	help += '\n' + pkg.name + '	: ' + pkg.description;
	help += '\nAuthor		: ' + author;
	help += '\nVersion		: ' + pkg.version;
	help += '\nRepository	: ' + pkg.repository.url;
	
	if (helpText) {
		help += '\n\n' + helpText + '\n';
	}
	
	help += '\n\nOptions	:\n';
	for (var i = 0, len = defKeys.length; i < len; i++) {
		var arg = defKeys[i];
		var spaces = this._createSpaces(this._maxLen - arg.length);
		help += '    ' + arg + spaces + ' : ' + this._def[arg].desc + '\n';
	}
	if (error) {
		help = '\n[error] *** ' + error.message + '\n' + help;
		help = '\033[0;31m' +  help + '\033[0m';
	} else {
		help = '\033[0;32m' + help + '\033[0m';
	}
	console.log(help + '\n');
	// we do not execute anything else in help mode
	this._gn.exit();
};

Argv.prototype._createSpaces = function (n) {
	var spaces = '';
	for (var i = 0; i < n; i++) {
		spaces += ' ';
	}
	return spaces;
};

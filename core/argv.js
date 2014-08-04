// --help is automatically defined and reserved
var HELP = '--help';
var argKeys = [];
var defKeys = [];
var exitOnBadOption = false;

module.exports = Argv;

function Argv(gn) {
	this._gn = gn;
	this._argv = {};	
	this._def = {};
	this._maxLen = 0;
}

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
		if (prev && arg.indexOf('-') !== 0) {
			// format: -name value
			if (this._argv[prev] === true) {
				this._argv[prev] = [];
			}
			this._argv[prev].push(lib.typeCast(arg));
			continue;
		}
		// format: -argument or -argument value
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

Argv.prototype.defineOption = function (arg, desc, cb) {
	this._def[arg] = { desc: desc, callback: cb };
	if (defKeys.indexOf(arg) === -1) {
		defKeys.push(arg);
	}
	if (arg.length > this._maxLen) {
		this._maxLen = arg.length;
	}
};

Argv.prototype.execDefinedOptions = function () {
	var optionCalled = 0;
	try {
		for (var i = 0, len = defKeys.length; i < len; i++) {
			var arg = defKeys[i];
			var option = this.get(arg);
			if (option && typeof this._def[arg].callback === 'function') {
				optionCalled += 1;
				this._def[arg].callback(option);
			}
		}
	} catch (e) {
		var logger = this._gn.log.create('argv');
		logger.error(e);
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
	var package = require('../package.json');
	console.log('\n' + package.name + ':', package.description);
	console.log('Authored by', package.author);
	console.log('Version:', package.version);
	console.log('Repository:', package.repository.url);
	console.log('\ngracenode command help:\n');
	for (var i = 0, len = defKeys.length; i < len; i++) {
		var arg = defKeys[i];
		var spaces = this._createSpaces(this._maxLen - arg.length);
		console.log('    ' + arg + spaces + ':', this._def[arg].desc);
	}
	console.log('\n');
	// we do not execute anything else in help mode
	this._gn.exit(error || 0);
};

Argv.prototype._createSpaces = function (n) {
	var spaces = '';
	for (var i = 0; i < n; i++) {
		spaces += ' ';
	}
	return spaces;
};

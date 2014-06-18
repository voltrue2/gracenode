// --help is automatically defined and reserved
var HELP = '--help';

module.exports = Argv;

function Argv(gn) {
	this._gn = gn;
	this._argv = {};	
	this._def = {};
	this._maxLen = 0;
}

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
			this._argv[sep[0]] = lib.typeCase(sep[1]);
			continue;
		}
		if (prev && arg.indexOf('-') === -1) {
			// format: -name value
			this._argv[prev] = lib.typeCast(arg);
			continue;
		}
		// format: -argument or -argument value
		this._argv[arg] = true;
		prev = arg;
	}
	console.log('<info>[argv] arguments:', this._argv);
	// check if --help option is present or not
	var help = this.get(HELP);
	if (help) {
		return this._showHelp();
	}
	// execute defined option(s)
	this._execDefinedOptions();
};

Argv.prototype.get = function (arg) {
	// -- format:
	if (arg.indexOf('--') === 0) {
		return this._argv[arg] || null;
	}
	if (arg.indexOf('-') === 0) {
		// - format -> this format supports combining multiple options: -abc is a combination of -a, -b, and -c
		arg = arg.replace('-', '');
		for (var key in this._argv) {
			if (key.indexOf('-') === 0 && key.indexOf(arg) !== -1) {
				return this._argv[key];
			}
		}
	}
	// no hyphnes
	return this._argv[arg] || null;
};

Argv.prototype.defineOption = function (arg, desc, cb) {
	this._def[arg] = { desc: desc, callback: cb };
	if (arg.length > this._maxLen) {
		this._maxLen = arg.length;
	}
};

Argv.prototype._execDefinedOptions = function () {
	for (var arg in this._def) {
		var option = this.get(arg);
		if (option && typeof this._def[arg].callback === 'function') {
			this._def[arg].callback(option);
		}
	}
};

Argv.prototype._showHelp = function () {
	console.log('\ngracenode command help:\n');
	for (var arg in this._def) {
		var spaces = this._createSpaces(this._maxLen - arg.length);
		console.log('    ' + arg + spaces + ':', this._def[arg].desc);
	}
	console.log('\n');
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

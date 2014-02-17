
var sys = require('sys');
var fs = require('fs');
var async = require('async');

var logger = require('../modules/log');
var sysLog = null;

var args = process.argv;
var filePath = args[1];
var path = filePath.replace('setup.js', '');
var root = path.replace('scripts/', '') + '../';
var configPath = args[2] || null;
var configData = null;

log('setting up the application...');

process.chdir(root);

log('root path changed to ' + root);

if (!configPath) {
	error('path to config file missing');
	process.exit(1);
}

log('loading the config file...');

fs.readFile(configPath, 'utf8', function (e, config) {
	if (e) {
		error(e);
		process.exit(1);
	}
	
	log('config file loaded');

	async.waterfall([
		// pass the config data
		function (callback) {
			callback(null, JSON.parse(config));
		},
		extractModules,
		findSetupScripts,
		extractScripts,
		execScripts
	],
	function () {
		log('all operations have been successfully executed');
		process.exit();
	});

});


/*****************************
*    operation functions     *
*****************************/
function extractModules(config, callback) {

	// keep config data around for later use
	configData = config;

	var modules = config.modules || null;
	if (!modules) {
		error('no modules found');
		process.exit(1);
	}
	
	// set up logger
	try {
		logger.readConfig(modules.log || null);
		sysLog = logger.create('setup');
	} catch (e) {
		error(e);
	}
	
	for (var name in modules) {
		log('module [' + name + '] found');
	}
	callback(null, modules);
}

function findSetupScripts(modules, callback) {
	fs.readdir(path, function (e, list) {
		if (e) {
			error(e);
			process.exit(1);
		}
		var matched = [];
		for (var name in modules) {
			if (list.indexOf(name) !== -1) {
				matched.push(name);
				log('set up script for [' + name + '] found');
			}
		}
		callback(null, matched);
	});
}

function extractScripts(dir, callback) {
	var scripts = [];
	async.eachSeries(dir, function (item, next) {
		var dirPath = path + item;
		fs.readdir(dirPath, function (e, list) {
			if (e) {
				error(e);
				process.exit(1);
			}
			scripts = scripts.concat(parseFileList(dirPath, item, list));
			next();
		});	
	},
	function () {
		log('scripts found:\n' + JSON.stringify(scripts, null, 4));
		callback(null, scripts);
	});
}

function parseFileList(dirPath, moduleName, list) {
	var files = [];
	for (var i = 0, len = list.length; i < len; i++) {
		var file = list[i];
		var type = file.substring(file.lastIndexOf('.') + 1);
		var filePath = dirPath + '/' + file;
		files.push({
			name: moduleName,
			file: file,
			type: type,
			path: filePath
		});
	}
	return files;
}

function execScripts(scripts, cb) {
	async.eachSeries(scripts, function (script, callback) {
		execScript(script, callback);
	}, cb);
}

function execScript(script, cb) {
	log('ready to execute: ' + script.path);
	switch (script.type) {
		case 'sh':
			return execBash(script, cb);
		case 'sql':
			return execSql(script, cb);
		case 'js':
			return execJs(script, cb);
		default:
			error(new Error('unknown script type: ' + script.type));
			process.exit(1);
			break;
	}
}

function execBash(script, cb) {
	// prompt for execution first
	handlePrompt(script, exec, cb);

	function exec() {
		var spawn = require('child_process').spawn;
		var sh = spawn('sh', [script.path]);
		
		sh.stdout.on('data', function (data) {
			sys.print(data);
		}); 

		sh.stderr.on('data', function (data) {
			sys.print(data);
		});

		sh.on('close', function (code) {
			sys.print('child process exited with code: ' + code);
			cb();
		});
	}
}

function execSql(script, cb) {
	// prompt for execution first
	handlePrompt(script, exec, cb);

	function exec() {
		var mysqlConfig = configData.modules.mysql;
		var myConfig = configData.modules[script.name];
		var conf = mysqlConfig[myConfig.sql.write];
		var spawn = require('child_process').spawn;
		var args = [
			'-u' + conf.user, 
			'--password=' + conf.password,
			conf.database,
			'< ' + script.path
		];

		log('executing sql file ' + script.path + ' with:\n' + JSON.stringify(args));

		if (conf.host !== 'localhost') {
			args.push('-h ' + conf.host);
		}
		var sql = spawn('mysql', args);
		
		sql.stdout.on('data', function (data) {
			sys.print(data);
		}); 

		sql.stderr.on('data', function (data) {
			sys.print(data);
		});

		sql.on('close', function (code) {
			sys.print('child process exited with code: ' + code + '\n');
			cb();
		});
	}
}

function execJs(script, cb) {
	cb();
}

function handlePrompt(script, exec, cb) {
	var readline = require('readline');
	var rl = readline.createInterface(process.stdin, process.stdout);	
	rl.setPrompt('\nExecute ' + script.path + '? [y/n]\n');
	rl.prompt();

	var question = rl.on('line', function (line) {
		this.removeAllListeners('line');
		switch (line.trim()) {
			case 'y':
				exec();
				break;
			case 'n':
				log('skipped: ' + script.path);
				cb();
				break;
			default:
				log('skipped: ' + script.path);
				cb();
				break;
		}
	});
}

function log(msg) {
	if (!sysLog) {
		return console.log('<log>', msg);
	}
	sysLog.info('<log> ', msg);
}

function error(msg) {
	if (!sysLog) {
		return console.error('<error>', msg);
	}
	sysLog.error('<error> ' + msg);
}

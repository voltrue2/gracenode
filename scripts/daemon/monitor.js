var fs = require('fs');
var net = require('net');
var spawn = require('child_process').spawn;
var gn = require('../../');
var socketName = require('./utils/socket-name');
var path;
var app;
var appNameForLog = gn.argv('start')[0] || null;
// if the application dies 10 times in 10 seconds, monitor will exit
var maxNumOfDeath = 10;
var deathInterval = 10000;
var timeOfDeath = 0;
var deathCount = 0;
var restartTime = 0;
var minLifeSpan = 60000; // the application needs to be alive at least for 60 seconds
var Log = require('./utils/log'); 
var logger = new Log(gn.argv('--log'));
// message
var Message = require('./utils/message');

// start file logging stream if enabled
logger.start(appNameForLog);

gn.on('uncaughtException', function (error) {
	logger.error('Exception in monitor process: ' + error);
	gn.exit(error);
});

gn.registerShutdownTask('exit', function (done) {
	handleExit();
	done();
});

gn.setConfigPath('node_modules/gracenode/scripts/configs/');
gn.setConfigFiles(['gracenode.json']);

gn.defineOption('start', 'Starts a monitor process to spawn and monitor application process(s).', function (pathIn) {
	path = pathIn[0] || null;
	var monitorServer = net.createServer(function (sock) {
		sock.on('error', handleExit);
		sock.on('data', handleCommunication);
	});
	var sockFile = socketName(path);
	monitorServer.listen(sockFile);
	startApp();
});

gn.setup(function () {});

function handleExit(error) {
	logger.stop(error, function () {
		fs.unlinkSync(socketName(path));
		process.exit(error || 0);
	});
}

function handleCommunication(msg) {
	// handle the command
	var command = msg.toString();
	switch (command) {
		case 'stop':
			// we instruct the application process to exit and exit monitor process
			stopApp(handleExit);
			break;
		case 'restart':
			// we instruct the application process to exit and let monitor process to respawn it
			if (Date.now() - restartTime > deathInterval) {
				restartTime = Date.now();
				stopApp();
				
			} else {
				var message = new Message(app.path);
				message.startSend();
				message.send({ error: 'Cannot "restart" in such a short interval. Must wait at least ' + (deathInterval / 1000) + ' seconds' });	
			}
			break;
		default:
			var parsed = parseCommand(command);
			if (parsed) {
				handleMessage(parsed);		
				break;
			}
			logger.error('unknown command: ' + command);
			break;
	}
}

function startApp() {
	// start the application process
	app = spawn(process.execPath, [path], { detached: true, stdio: 'ignore' });
	app.path = path;
	app.started = Date.now();
	logger.info('started daemon process of ' + path);
	// if appllication dies unexpectedly, respawn it
	app.once('exit', function (code, signal) {
		deathCount += 1;
		logger.info('daemon process of ' + path + ' has exited (code:' + code + '): count of death [' + deathCount + '/' + maxNumOfDeath + ']');
		if (signal) {
			logger.error('application terminated by: ' + signal);
		}
		if (deathCount === 1) {
			// application died for the first time
			timeOfDeath = Date.now();
			// check to see if the application was alive for at least minLifeSpan or not
			if (timeOfDeath - app.started < minLifeSpan) {
				// the application has died in less than minLifeSpan > we consider the application has some issues...
				var lasted = ((timeOfDeath - app.started) / 1000) + ' seconds';
				var msg = 'application died [' + path + '] in ' + lasted + '. the application must be available for at least ' + (minLifeSpan / 1000) + ' seconds';
				return handleExit(new Error(msg));
			}
		}
		if (deathCount >= maxNumOfDeath) {
			var now = Date.now();
			if (now - timeOfDeath <= deathInterval) {
				// the application is dying way too fast and way too often
				return handleExit(new Error('appliation [' + path + '] is dying too fast and too often'));
			}
			// application has died more than maxNumOfDeath but not too fast...
			deathCount = 0;
		}
		// respawn application process
		logger.info('restarting daemon process of ' + path);
		startApp();
		var message = new Message(path);
		message.startSend();
		message.send({ success: true });
	});
}

function stopApp(cb) {
	if (app) {
		// restart logger to make sure log file is rotated
		logger.restart(function () {
			// stop application
			app.kill();
			logger.info('stopped daemon process of ' + app.path);
			if (cb) {
				cb();
			}
		});
		return;
	}
	if (cb) {
		cb();
	}
}

function parseCommand(cmd) {
	var sep = cmd.split('\t');
	if (sep[0] === 'message' && sep[1] && sep[2]) {
		return { command: sep[1], value: sep[2] };
	}
	return false;
}

function handleMessage(parsed) {
	switch (parsed.command) {
		case 'status':
			var message = new Message(parsed.value);
			message.startSend();
			message.send({
				pid: app.pid,
				started: app.started,
				numOfRestarted: deathCount
			});
			break;
		default:
			break;
	}
}

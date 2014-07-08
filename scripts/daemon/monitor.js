var fs = require('fs');
var net = require('net');
var spawn = require('child_process').spawn;
var gn = require('../../');
var socketName = require('./socket-name');
var logger;
var path;
var app;

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
	fs.unlinkSync(socketName(path));
	process.exit(error || 0);
}

function handleCommunication(msg) {
	var command = msg.toString();
	switch (command) {
		case 'stop':
			// we instruct the application process to exit and exit monitor process
			stopApp(handleExit);
			break;
		case 'restart':
			// we instruct the application process to exit and let monitor process to respawn it
			stopApp();
			break;
		default:
			logger.error('unknown command:', command);
			break;
	}
}

function startApp() {
	app = spawn(process.execPath, [path, '--daemon'], { detached: true, stdio: 'ignore' });
	// if appllication dies unexpectedly, respawn it
	app.on('exit', startApp);

}

function stopApp(cb) {
	if (app) {
		app.kill();
		if (cb) {
			cb();
		}
	}
}

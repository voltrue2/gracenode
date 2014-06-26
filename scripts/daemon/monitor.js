var fs = require('fs');
var net = require('net');
var fork = require('child_process').fork;
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
		logger.info('monitor ready');
		sock.on('error', handleExit);
		sock.on('end', handleExit);
		sock.on('data', handleCommunication);
	});
	monitorServer.listen(socketName(path));
	startApp();
});

gn.setup(function () {
	logger = gn.log.create('daemon-monitor');
	logger.info('monitor starting... (pid:' + process.pid + ')');
});

function handleExit(error) {
	fs.unlinkSync(socketName(path));
	process.exit(error || 0);
}

function handleCommunication(msg) {
	var command = msg.toString();
	switch (command) {
		case 'stop':
			stopApp();
			break;
		case 'restart':
			break;
		default:
			logger.error('unkown command:', command);
			break;
	}
}

function startApp() {
	app = fork(path, ['--daemon']);
	// if appllication dies unexpectedly, respawn it
	app.on('exit', startApp);
}

function stopApp(path) {
	if (app) {
		var appSock = require('../../core/daemon').getAppSocketName(app.pid);
		var appService = new net.Socket();
		appService.connect(appSock, function () {
			appService.write('stop');
			app = null;
		});
	}
}

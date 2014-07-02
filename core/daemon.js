var fs = require('fs');
var net = require('net');
var gn;

// called from core/index
module.exports.setGracenode = function (gracenode) {
	gn = gracenode;
};

// assigned in core/process
module.exports.processObj = null;

// called from daemon tool
module.exports.getAppSocketName = socketName;

// called from application master to send 'exit' command to each child process
module.exports.sendMsg = function (pid, msg, cb) {
	var client = new net.Socket();
	client.connect(socketName(pid), function () {
		client.write(msg);
		cb();
	});
};

// master only
// internal use only for daemonizing the application
// we are not useing defineOption() because we do not want this to show up in --help
module.exports.setupDaemonService = function () {
	if (gn.argv('--daemon')) {
		// creates a server that listens to commands from daemon tool
		var server = net.createServer(function (sock) {
			sock.on('error', handleExit);
			sock.on('end', handleExit);
			sock.on('data', handleMessage);
		});
		server.listen(socketName(process.pid));
		process.on('exit', handleExit);
	}
};

function socketName(pid) {
	var sockName = '/tmp/gracende-app-' + pid + '-' + gn.getRootPath().replace(/\//g, '-') + '.sock';
	return sockName;
}

function handleExit() {
	try {
		fs.unlinkSync(socketName(process.pid));
	} catch (e) {
		console.error('socket file already gone');
	}
}

function handleMessage(msg) {
	var command = msg.toString();
	switch (command) {
		case 'stop':
			// command sent from daemon tool to application master
			module.exports.processObj.exit('SIGTERM');
			break;
	}
}

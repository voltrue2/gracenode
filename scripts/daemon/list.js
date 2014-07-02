var exec = require('child_process').exec;
var gn = require('gracenode');
var logger = gn.log.create('daemon-list');

module.exports = function () {
	
	logger.debug('here?');	

	exec('ps -axu | grep node', function (error, stdout) {
		if (error) {
			return gn.exit(error);
		}
		var list = stdout.split('\n');
		for (var i = 0, len = list.length; i < len; i++) {
			if (list[i].indexOf('gracenode/scripts/daemon/monitor') !== -1) {
				console.log('\n');
				console.log('	Daemon monitor process:    ', trim(list[i]));
				continue;
			}
			if (list[i].indexOf('--daemon') !== -1) {
				console.log('	Application daemon process:', trim(list[i]));
			}
		}
		console.log('\n');
		gn.exit();
	});
};

function trim(str) {
	var pid = '';
	var sep = str.split(' ');
	for (var i = 0, len = sep.length; i < len; i++) {
		if (sep[i] !== '' && !isNaN(sep[i])) {
			pid = sep[i];
			break;
		}
	}
	return '(pid:' + pid + ') ' + str.substring(str.indexOf(process.execPath));
}

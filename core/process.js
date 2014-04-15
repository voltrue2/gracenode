var EventEmitter = require('events').EventEmitter;
var util = require('util');
var cluster = require('cluster');

module.exports = Process;

function Process(gracenode) {
	EventEmitter.call(this);
	this.gracenode = gracenode;
	this.log = this.gracenode.log.create('process');
	this.config = this.gracenode.config.getOne('cluster');
	if (!this.config) {
		// no configurations for cluster mode provided
		this.config = {};
	}	
	
	this.inClusterMode = this.config.enable || false;
	var maxClusterNum = this.config.max || 1;
	var CPUNum = require('os').cpus().length;
	this.clusterNum = Math.min(maxClusterNum, CPUNum);

	this.log.verbose('number of avialable CPU cores:', CPUNum);
	this.log.verbose('cluster mode:', this.inClusterMode);
	this.log.verbose('number of allowed child processes:', this.clusterNum);
}

util.inherits(Process, EventEmitter);

// public
Process.prototype.setup = function () {
	this.log.verbose('setting up the process...');

	if (this.inClusterMode && this.clusterNum > 1) {
		// cluster mode is enabled and allowed child process is more than 1 > we are in cluster mode
		this.startClusterMode();
		return;
	}
	
	// we are NOT in cluster mode
	this.log.info('running the process in none-cluster mode (pid: ' + process.pid + ')');
	
	this.emit('nocluster.setup');
};

// private	
Process.prototype.startClusterMode = function () {
	if (cluster.isMaster) {
		return this.setupMaster();
	}

	this.setupWorker();
};

//private
Process.prototype.setupMaster = function () {
	this.gracenode.log.setPrefix('MASTER:' + process.pid);
	this.gracenode._isMaster = true;

	this.log.info('running the process in cluster mode [master] (pid: ' + process.pid + ')');
	this.log.info('number of child processes to be spawned:', this.clusterNum);
	
	var that = this;

	// spawn workers
	for (var i = 0; i < this.clusterNum; i++) {
		var worker = cluster.fork();
		this.log.info('worker spawed (pid: ' + worker.process.pid + ')');
	}

	// set up termination listener on workers
	cluster.on('exit', function (worker, code, signal) {
		that.log.error('worker has died (pid: ' + worker.process.pid + ') [signal: ' + signal + '] code: ' + code);	
	});

	// set up listener on master process shutdown
	this.gracenode.on('shutdown', function (signal) {
		that.log.info('shutting down all workers...');
		var workers = cluster.workers;
		for (var id in workers) {
			var worker = workers[id];
			worker.kill(signal);
			that.log.info('shutting down worker (pid: ' + worker.process.pid + ')');
		}
	});

	this.log.info('master has been set up');

	this.emit('cluster.master.setup', process.pid);
};

// private 
Process.prototype.setupWorker = function () {
	this.gracenode._isMaster = false;
	this.gracenode.log.setPrefix('WORKER:' + process.pid);
	this.log.info('running the process in cluster mode [worker] (pid: ' + process.pid + ')');
	
	this.emit('cluster.worker.setup', process.pid);
};

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
		this.startClusterMode();
		return;
	}
	
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
	this.gracenode._isMaster = true;
	this.gracenode.log._setInternalPrefix('MASTER:' + process.pid);
	this.log = this.gracenode.log.create('process');

	this.log.info('running the process in cluster mode [master] (pid: ' + process.pid + ')');
	this.log.info('number of child processes to be spawned:', this.clusterNum);
	
	var that = this;

	var onGracefulExit = function () {
		that.log.info('worker (pid:' + this.process.pid + ') has gracefully shutdown');
	};

	// spawn workers
	for (var i = 0; i < this.clusterNum; i++) {
		var worker = cluster.fork();
		worker.on('disconnect', onGracefulExit);
		this.log.info('worker spawned (pid: ' + worker.process.pid + ')');
	}

	// set up termination listener on workers
	cluster.on('exit', function (worker, code, signal) {
		var logger = that.log.info;
		if (code > 0) {
			logger = that.log.error;
		}
		logger.apply(that.log, ['worker has died (pid: ' + worker.process.pid + ') [signal: ' + signal + '] code: ' + code]);	
	});

	// set up graceful shutdown of cluster workers on master exit
	this.gracenode._gracefulClusterExit = function (cb) {
		that.log.info('shutting down all workers...');
		cluster.disconnect(function () {
			that.log.info('all workers have gracefully shutdown');
			cb();
		});	
	};

	this.log.info('master has been set up');

	this.emit('cluster.master.setup', process.pid);
};

// private 
Process.prototype.setupWorker = function () {
	this.gracenode._isMaster = false;
	this.gracenode.log._setInternalPrefix('WORKER:' + process.pid);
	this.log.info('running the process in cluster mode [worker] (pid: ' + process.pid + ')');
	
	this.emit('cluster.worker.setup', process.pid);
};

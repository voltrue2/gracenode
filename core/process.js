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

	this.listeners();

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
		that.log.info('worker (pid:' + this.process.pid + ') has disconnected');
	};

	// spawn workers
	for (var i = 0; i < this.clusterNum; i++) {
		var worker = cluster.fork();
		worker.on('disconnect', onGracefulExit);
		this.log.info('worker spawned (pid: ' + worker.process.pid + ')');
	}

	// set up termination listener on workers
	cluster.on('exit', function (worker, code, signal) {
		if (!worker.suicide && signal) {
			// the worker died from an error, spawn it
			var newWorker = cluster.fork();
			return that.log.info('a new worker (pid:' + newWorker.process.pid + ') spawned because a worker has died (pid:' + worker.process.pid + ')');
		}
		that.log.info('worker has died (pid: ' + worker.process.pid + ') [signal: ' + signal + '] code: ' + code);	
	});
	
	this.log.info('master has been set up');

	this.emit('cluster.master.setup', process.pid);
};

// private 
Process.prototype.setupWorker = function () {
	this.gracenode._isMaster = false;
	this.gracenode.log._setInternalPrefix('WORKER:' + process.pid);
	this.log = this.gracenode.log.create('child-process');
	this.log.info('running the process in cluster mode [worker] (pid: ' + process.pid + ')');
	
	this.emit('cluster.worker.setup', process.pid);
};

// private 
Process.prototype.exit = function () {
	
	if (this.gracenode._isMaster) {
		// master process
		var that = this;
		return cluster.disconnect(function () {
			that.log.info('all child processes have disconnected: exiting master process...');
			that.emit('shutdown');
			that.gracenode.exit();
		});
	}
	
	// worker process
	cluster.worker.disconnect();
	this.emit('shutdown');
	this.gracenode.exit();
};

// private
Process.prototype.listeners = function () {

	var that = this;
	
	process.on('SIGINT', function () {
		that.log.info('SIGINT caught: shutting down gracenode...');
		that.exit();
	});

	process.on('SIGQUIT', function () {
		that.log.info('SIGQUIT caught: shutting down gracenode...');
		that.exit();
	});

	process.on('SIGTERM', function () {
		that.log.info('SIGTERM caught: shutting down gracenode...');
		that.exit();
	});

};

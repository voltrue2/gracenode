'use strict';

const EventEmitter = require('events').EventEmitter;
const utils = require('util');
const gn = require('../gracenode');
const async = require('../../lib/async');
const transport = require('../../lib/transport');
const rpc = require('./rpc');
// this is not HTTP router
const router = require('./router');

const PING_MSG = gn.Buffer.alloc('ping');
const PONG_MSG = gn.Buffer.alloc('PONG\n');
// a response object must not live longer than 30 seconds
const RESPONSE_TTL = 30000;

var logger;
var heartbeatConf;
var cryptoEngine;
var callbackTimeout = 0;

module.exports.setup = function __rpcConnectionSetup() {
    logger = gn.log.create('RPC.connection');
    heartbeatConf = gn.getConfig('rpc.heartbeat');
};

module.exports.requireCallback = function __rpcConnectionReqCb(timeout) {
    callbackTimeout = timeout;
};

module.exports.useCryptoEngine = function __rpcConnectionUseCryptoEngine(_cryptoEngine) {
    cryptoEngine = _cryptoEngine;
};

module.exports.create = function __rpcConnectionCreate(sock) {
    return new Connection(sock);
};

function Connection(sock) {
    EventEmitter.call(this);
    var you = sock.remoteAddress + ':' + sock.remotePort;
    // holds all response objects
    this.incomingPacketQueue = [];
    this.incomingLoopTriggered = false;
    this.responses = {};
    this.sock = sock;
    this.id = gn.lib.uuid.v4().toString();
    this.state = createState(this.id);
    var params = { that: this };
    // allow the client to change the heartbeat timeout
    this.state.changeHeartbeatTimeout = _changeHeartbeatTimeout.bind(null, params);
    // server push
    this.state.send = _send.bind(null, params);
    // server response (if you need to use this to pretend as a response)
    this.state.respond = _respond.bind(null, params);
    // force disconnect (graceful) connection
    this.state.close = _close.bind(null, params);
    // force kill connection
    this.state.kill = _kill.bind(null, params);

    this.parser = new transport.Stream();
    this.connected = true;
    this.name = '{ID:' + this.id + '|p:' + sock.localPort + '|' + you + '}';
    this.sock.on('data', _onDataReceived.bind(null, params));
    this.sock.on('end', _onConnectionEnd.bind(null, params));
    this.sock.on('error', _onConnectionError.bind(null, params));
    this.sock.on('close', _onConnectionClose.bind(null, params));
    this.sock.on('timeout', _onConnectionTimeout.bind(null, params));

    if (heartbeatConf) {
        this._checkHeartbeat();
    }
}

function _changeHeartbeatTimeout(bind, time) {
    bind.that.state.heartbeatTimeout = time;
}

function _send(bind, payload) {
    bind.that._send(payload);
}

function _respond(bind, payload, status, options) {
    bind.that._respond(payload, status, options);
}

function _close(bind) {
    bind.that.close();
}

function _kill(bind, error) {
    bind.that.kill(error);
}

function _onDataReceived(bind, packet) {
    bind.that.state.now = gn.lib.now();
    bind.that._data(packet);
}

function _onConnectionEnd(bind) {
    logger.sys(bind.that.name, 'TCP connection ended by client');
    bind.that.kill(new Error('TCP disconnected by client'));
}

function _onConnectionError(bind, error) {
    logger.error(bind.that.name, 'TCP connection error detected:', error);
    bind.that.kill(error);
}

function _onConnectionClose(bind) {
    bind.that.close();
}

function _onConnectionTimeout(bind, error) {
    if (error) {
        return bind.that.close(error);
    }
    bind.that.close(new Error('TCP connection timeout'));
}

utils.inherits(Connection, EventEmitter);

Connection.prototype._send = function __rpcConnectionSend(payload) {
    this._push(payload);
};
// server response (if you need to use this to pretend as a response)
Connection.prototype._respond = function __rpcConnectionRespond(payload, status, options) {
    var error = null;
    if (payload instanceof Error) {
        payload = payload.message;
        error = payload;
    }
    if (!status) {
        if (error) {
            status = this.state.STATUS.BAD_REQ;
        } else {
            status = this.state.STATUS.OK;
        }
    }
    var params = {
        that: this,
        options: options
    };
    this._write(
        error,
        status,
        this.state.seq,
        payload,
        _onRespond.bind(params)
    );
};

function _onRespond() {
    var that = this.that;
    var options = this.options;
    if (options) {
        if (options.closeAfterReply) {
            return that.close();
        }
        if (options.killAfterReply) {
            return that.kill();
        }
    }
}

Connection.prototype._checkResponses = function _rpcConnectionCheckResponses() {
    var now = gn.lib.now();
    for (var id in this.responses) {
        if (this.responses[id].ttl <= now) {
            _discardResponse(this, id);
        }
    }
};

Connection.prototype._checkHeartbeat = function __rpcConnectionHeartbeatChecker() {
    try {
        if (!this.connected) {
            if (this.sock) {
                this.sock.emit('error', new Error('RPC connection lost'));
            } else {
                this.emit('clear', true, this.id);
            }
            return;
        }
        if (this.isTimedout()) {
            if (this.sock) {
                this.sock.emit('timeout', new Error('RPC heartbeat timeout'));
            } else {
                this.emit('clear', true, this.id);
            }
            return;
        }
    } catch (error) {
        logger.error(this.name, 'TCP heartbeat error:', error);
    }
    setTimeout(_callHeartbeatCheck.bind({ that: this }), heartbeatConf.checkFrequency);
};

// we check reponse objects and hartbeat
function _callHeartbeatCheck() {
    this.that._checkResponses();
    this.that._checkHeartbeat();
}

Connection.prototype.isTimedout = function __rpcConnectionIsTimedout() {
    var hbtime = this.state.heartbeatTimeout || heartbeatConf.timeout;
    var delta = gn.lib.now() - this.state.now;
    if (delta >= hbtime) {
        return true;
    }
    return false;
};

Connection.prototype.close = function __rpcConnectionClose(error) {
    if (this.sock) {
        try {
            if (error) {
                logger.sys(this.name, 'TCP connection closed by error:', error);
                // force close (closed)
                this.sock.destroy();
            } else {
                logger.sys(this.name, 'TCP connection closed');
                // send FIN packet (half-closed)
                this.sock.end();
            }
        } catch (e) {
            logger.error(this.name, 'TCP socket end failed:', e);
        }
    }
    this._clear();
};

Connection.prototype.kill = function __rpcConnectionKill(error) {
    if (this.sock) {
        if (error) {
            logger.sys(this.name, 'TCP connection killed from server:', error);
        } else {
            logger.sys(this.name, 'TCP connection killed from server');
        }
        try {
            this.sock.destroy();
        } catch (e) {
            logger.error(this.name, 'TCP socket destory failed:', e);
        }
    }
    this._clear(true);
};

Connection.prototype._data = function __rpcConnectionDataHandler(packet) {
    // we put the packet in the queue to make sure the order of packets being handled is maintained
    this.incomingPacketQueue.push(packet);
    if (this.incomingPacketQueue.length && !this.incomingLoopTriggered) {
        this.incomingLoopTriggered = true;
        this._handlePendingInComingPacket();
    }
};

Connection.prototype._handlePendingInComingPacket = function __rpcConnectionHandlePendingInComingPacket() {
    var packet = this.incomingPacketQueue.shift();
    if (!packet) {
        // there is no more packet in the queue
        this.incomingLoopTriggered = false;
        return;
    }
    if (this._handleIfPing(packet)) {
        return;
    }
    var parsed = this.parser.parse(packet);
    if (parsed instanceof Error) {
        return this.kill(parsed);
    }
    var params = { that: this };
    async.loopSeries(
        parsed,
        params,
        _onEachData.bind(null, params),
        _onDataHandled.bind(null, params)
    );
};

Connection.prototype._handleIfPing = function __rpcConnectionHandleIfPing(packet) {
    if (packet[0] === PING_MSG[0] &&
        packet[1] === PING_MSG[1] &&
        packet[2] === PING_MSG[2] &&
        packet[3] === PING_MSG[3]
    ) {
        this.__write(null, PONG_MSG, _onHandlePing.bind(null, { that: this }));
        return true;
    }
    return false;
};

function _onHandlePing(bind) {
    bind.that.close();
}

function _onDataHandled(bind, error) {
    if (error) {
        return bind.that.kill(error);
    }
    // there is no more pending incoming packet in the queue
    if (!bind.that.incomingPacketQueue.length) {
        bind.that.incomingLoopTriggered = false;
        return;
    }
    // try to handle next packet in the queue
    process.nextTick(function () {
        bind.that._handlePendingInComingPacket();
    });
}

function _onEachData(bind, parsedData, params, next) {
    if (!parsedData) {
        return next();
    }
    var id = gn.lib.uuid.v4().toString();
    bind.that.responses[id] = _createResponse(gn.lib.now());
    logger.sys('Command response initialized ID:', id);
    var bind2 = { that: bind.that, id: id };
    params.that._decrypt(bind2, parsedData, next);
}

function _createResponse(now) {
    return {
        ttl: now + RESPONSE_TTL,
        data: null,
        options: null,
        timeout: null,
        skipped: false,
        status: transport.STATUS.OK
    };
}

Connection.prototype._decrypt = function __rpcConnectionDecrypt(bind, parsedData, cb) {
    // handle command routing
    var cmd = router.route(this.name, parsedData);
    // execute command w/ encryption and decryption
    if (cryptoEngine && cryptoEngine.decrypt) {
        if (!this.sock) {
            return cb(new Error('SocketUnexceptedlyGone'));
        }
        var that = this;
        var params = {
            id: bind.id,
            that: that,
            parsedData: parsedData,
            cmd: cmd,
            cb: cb
        };
        cryptoEngine.decrypt(
            parsedData.payload,
            gn.session.PROTO.RPC,
            this.sock.remoteAddress,
            this.sock.remotePort,
            _onDecrypt.bind(null, params)
        );
        return;
    }
    // execute command w/o encryption + decryption
    if (!cmd) {
        return this._errorResponse(bind.id, parsedData, null, cb);
    }
    this._execCmd(bind.id, cmd, parsedData, null, cb);
};

function _onDecrypt(bind, error, sid, seq, sdata, decrypted) {
    if (error) {
        return bind.cb(error);
    }
    var sess = {
        sessionId: sid,
        seq: seq,
        data: sdata
    };
    bind.parsedData.payload = decrypted;
    if (!bind.cmd) {
        return bind.that._errorResponse(bind.id, bind.parsedData, sess, bind.cb);
    }
    bind.that._execCmd(bind.id, bind.cmd, bind.parsedData, sess, bind.cb);
}

Connection.prototype._errorResponse = function __rpcConnectionErrorResponse(id, parsedData, sess, cb) {
    _discardResponse(this, id);
    if (!this.sock) {
        return cb(new Error('SocketUnexceptedlyGone'));
    }
    var msg = gn.Buffer.alloc('NOT_FOUND');
    this.state.command = parsedData.command;
    this.state.payload = parsedData.payload;
    this.state.seq = parsedData.seq;
    this.state.clientAddress = this.sock.remoteAddress;
    this.state.clientPort = this.sock.remotePort;
    if (sess) {
        this.state.sessionId = sess.sessionId;
        this.state.seq = sess.seq;
        this.state.session = sess.data;
    }
    this._write(new Error('NOT_FOUND'), this.state.STATUS.NOT_FOUND, this.state.seq, msg, cb);
};

Connection.prototype._execCmd = function __rpcConnectionExecCmd(id, cmd, parsedData, sess, cb) {
    if (!this.sock) {
        _discardResponse(this, id);
        return cb(new Error('SocketUnexceptedlyGone'));
    }
    this.state.command = parsedData.command;
    this.state.payload = parsedData.payload;
    this.state.seq = parsedData.seq;
    this.state.clientAddress = this.sock.remoteAddress;
    this.state.clientPort = this.sock.remotePort;
    if (sess) {
        this.state.sessionId = sess.sessionId;
        this.state.seq = sess.seq;
        this.state.session = sess.data;
    }
    // execute hooks before the handler(s)
    var params = {
        id: id,
        that: this,
        cmd: cmd,
        parsedData: parsedData,
        cb: cb
    };
    cmd.hooks(parsedData, this.state, _onHooksFinished.bind(null, params));
};

function _discardResponse(that, id) {
    if (that.responses[id]) {
        logger.verbose('Response discarded ID:', id);
        if (that.responses[id].timeout) {
            clearTimeout(that.responses[id].timeout);
            that.responses[id].timeout = null;
        }
        delete that.responses[id];
    }
}

function _onHooksFinished(bind, error, status) {
    var that = bind.that;
    var cmd = bind.cmd;
    var parsedData = bind.parsedData;
    var cb = bind.cb;
    var params = {
        id: bind.id,
        that: that,
        cmd: cmd,
        parsedData: parsedData,
        cb: cb
    };
    if (error) {
        var msg = gn.Buffer.alloc(error.message);
        if (!status) {
            status = transport.STATUS.BAD_REQ;
        }
        return that._write(error, status, parsedData.seq, msg, cb);
    }
    async.eachSeries(
        cmd.handlers,
        _onEachCommand.bind(null, params),
        _onCommandsFinished.bind(null, params)
    );
}

function _onEachCommand(bind, handler, next) {
    var that = bind.that;
    var cmd = bind.cmd;
    var params = {
        id: bind.id,
        that: that,
        cmd: cmd,
        next: next
    };
    if (callbackTimeout && that.responses[bind.id]) {
        var response = that.responses[bind.id];
        response.timeout = setTimeout(
            _onResponseTimeout.bind(null, params),
            callbackTimeout
        );
    }
    handler(that.state, _onCommand.bind(null, params));
}

function _onResponseTimeout(bind) {
    var id = bind.id;
    var that = bind.that;
    var cmd = bind.cmd;
    var next = bind.next;
    logger.error(
        that.name,
        'command', cmd.id, cmd.name,
        'callback is required but not called in',
        callbackTimeout + 'ms',
        'respond as an error with status',
        transport.STATUS.SERVER_ERR
    );
    var response = that.responses[id];
    if (response) {
        response.skipped = true;
        response.status = transport.STATUS.SERVER_ERR;
        response.data = gn.Buffer.alloc('MISSING_CALLBACK');
    }
    next();
}

function _onCommand(bind, _res, _status, _options) {
    var id = bind.id;
    var that = bind.that;
    var next = bind.next;
    var response = that.responses[id] || _createResponse(gn.lib.now());
    if (response.timeout) {
        clearTimeout(response.timeout);
        response.timeout = null;
    }
    if (response.skipped) {
        // timeout has been called: skip
        _discardResponse(that, id);
        return;
    }
    response.options = _options;
    if (_res instanceof Error) {
        if (!_status) {
            _status = transport.STATUS.BAD_REQ;
        }
        response.status = _status;
        response.data = gn.Buffer.alloc(_res.message);
        return next(_res);
    }
    if (!_status) {
        _status = transport.STATUS.OK;
    }
    response.status = _status;
    response.data = _res;
    next();
}

function _onCommandsFinished(bind, error) {
    var id = bind.id;
    var that = bind.that;
    var parsedData = bind.parsedData;
    var cb = bind.cb;
    var params = {
        id: id,
        that: that,
        cb: cb
    };
    var response = that.responses[id];
    // respond to client
    if (!response || !response.data) {
        _discardResponse(that, id);
        throw new Error('MissingResponsePacket');
    }
    that._write(
        error,
        response.status,
        parsedData.seq,
        response.data,
        _onCommandResponseFinished.bind(null, params)
    );
}

function _onCommandResponseFinished(bind, error) {
    var id = bind.id;
    var that = bind.that;
    var cb = bind.cb;
    var response = that.responses[id];
    if (response && response.options) {
        if (response.options.closeAfterReply) {
            return that.close();
        }
        if (response.options.killAfterReply) {
            return that.kill();
        }
    }
    _discardResponse(that, id);
    cb(error);
}

Connection.prototype._write = function __rpcConnectionWrite(_error, status, seq, msg, cb) {
    if (typeof msg === 'object' && !(msg instanceof Buffer)) {
        msg = JSON.stringify(msg);
    }
    var params = {
        that: this,
        _error: _error,
        status: status,
        seq: seq,
        cb: cb
    };
    this._encrypt(msg, _onWriteEncrypt.bind(null, params));
};

function _onWriteEncrypt(bind, error, data) {
    var that = bind.that;
    var _error = bind._error;
    var status = bind.status;
    var seq = bind.seq;
    var cb = bind.cb;
    data = transport.createReply(status, seq, data);
    if (error) {
        return that.__write(error, data, cb);
    }
    that.__write(_error, data, cb);
}

Connection.prototype._push = function __rpcConnectionPush(msg, cb) {
    if (typeof msg === 'object' && !(msg instanceof Buffer)) {
        msg = JSON.stringify(msg);
    }
    this._encrypt(msg, _onPushEncrypt.bind(null, { that: this, cb: cb }));
};

function _onPushEncrypt(bind, error, data) {
    if (error) {
        return bind.cb(error);
    }
    bind.that.__push(transport.createPush(0, data), bind.cb);
}

Connection.prototype.__write = function __rpcConnectionWriteToSock(error, data, cb) {

    if (rpc.shutdown()) {
        return cb();
    }

    if (!this.sock || !this.connected) {
        return cb();
    }

    if (error) {
        logger.sys(this.name, 'error response:', error, 'size:', data.length, 'bytes');
    }

    try {
        this.sock.write(data, 'binary');
    } catch (e) {
        logger.error(this.name, 'write to the TCP socket (response) failed:', e);
    }
    if (typeof cb === 'function') {
        cb();
    }
};

Connection.prototype.__push = function __rpcConnectionPushToSock(data, cb) {

    if (rpc.shutdown()) {
        return cb();
    }

    if (!this.sock || !this.connected) {
        if (!cb) {
            return;
        }
        return cb();
    }
    try {
        this.sock.write(data, 'binary');
    } catch (e) {
        logger.error(this.name, 'write to the TCP socket (push) failed:', e);
    }
};

Connection.prototype._encrypt = function __rpcConnectionEncrypt(msg, cb) {
    if (!this.connected) {
        return;
    }
    if (cryptoEngine && cryptoEngine.encrypt) {
        cryptoEngine.encrypt(this.state, msg, _onEncrypt.bind(null, { cb: cb }));
        return;
    }
    cb(null, msg);
};

function _onEncrypt(bind, error, data) {
    if (error) {
        return bind.cb(error);
    }
    bind.cb(null, data);
}

Connection.prototype._clear = function __rpcConnectionClear(killed) {
    this.connected = false;
    if (this.sock) {
        this.sock.removeAllListeners();
        try {
            this.sock.destroy();
        } catch (err) {
            logger.error('Clearing socket object error:', err);
        }
    }
    if (this.parser) {
        delete this.parser.buffer;
    }
    delete this.state;
    delete this.sock;
    delete this.parser;
    this.emit('clear', killed, this.id);
    this.removeAllListeners();
};

function createState(id) {
    return {
        STATUS: transport.STATUS,
        // RPC allows individual client to have out heartbeat timeout as well...
        heartbeatTimeout: 0,
        command: 0,
        payload: null,
        connId: id,
        clientAddress: null,
        clientPort: null,
        sessionId: null,
        seq: 0,
        session: null,
        changeHeartbeatTimeout: null,
        respond: null,
        send: null,
        push: null,
        close: null,
        kill: null,
        now: gn.lib.now()
    };
}

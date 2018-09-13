'use strict';

const neti = require('os').networkInterfaces();
const transport = require('../../lib/transport');
const async = require('../../lib/async');
const gn = require('../gracenode');
const dgram = require('dgram');
// UDP router
const router = require('./router');
// UDP command hooks
const hooks = require('./hooks');

const PING_MSG = gn.Buffer.alloc('ping');
const PONG_MSG = gn.Buffer.alloc('PONG\n');
const CLEAN_INTERVAL = 60000;
// configurable
const PORT_IN_USE = 'EADDRINUSE';
const IPv6 = 'ipv6';
const IPv4 = 'ipv4';
const IPV6_ADDR_PREFIX = 'fe80';
const LAST_RANGE = 1000;
const DEFAULT_NETWORKINTERFACE = 'eth0';
const LOCALHOST = '127.0.0.1';
const clientMap = {};

var udpVersion = 'udp4';
var ipv6 = false;
var logger;
var config;
var server;
var onErrorHandler;
var shutdown = false;

const cryptoEngine = {
    encrypt: null,
    decrypt: null
};
const connectionInfo = {
    host: null,
    port: null
};

module.exports.name = 'udp';

module.exports.info = function __udpInfo() {
    return {
        address: connectionInfo.address,
        host: connectionInfo.host,
        port: connectionInfo.port,
        family: connectionInfo.family
    };
};

module.exports.setup = function __udpSetup(cb) {
    logger = gn.log.create('UDP');
    config = gn.getConfig('udp');
    if (!gn.isSupportedVersion()) {
        return gn.stop(new Error(
            'UDP server does not support node.js version: ' + process.version
        ));
    }
    if (config.manualStart) {
        logger.info('UDP server must be started manually by gracenode.manualStart([ gracenode.udp ], callback)');
        return cb();
    }
    module.exports.startModule(cb);
};

module.exports.startModule = function (cb) {
    if (config && config.port) {
        config.portRange = [
            config.port,
            config.port + LAST_RANGE
        ];
    }

    if (!config || !config.portRange) {
        return cb();
    }

    // set network interface name to beused to obtain the address to bind if there's no address provided
    if (!config.nic) {
        config.nic = DEFAULT_NETWORKINTERFACE;
    }

    // set transport protocol
    if (config.protocol) {
        transport.use(config.protocol);
    }

    // change default max size for packets
    if (config.maxPacketSize) {
        transport.setMaxSize(config.maxPacketSize);
    }

    logger.info('Max packet size:', transport.getMaxPacketSize());
    
    var addrMap = findAddrMap();
    logger.info('Available Addresses:', addrMap);    

    if (config.version && config.version.toLowerCase() === IPv6) {
        ipv6 = true;
        udpVersion = 'udp6';
    }

    if (!config.address) {
        logger.info('Obtaining the address dynamically from network interface', config.nic);
        if (ipv6) {
            config.address = addrMap.ipv6[config.nic];
        } else {
            config.address = addrMap.ipv4[config.nic];
        }
        if (!config.address) {
            logger.info('Network interface', config.nic, 'not found falling back to localhost');
            config.address = LOCALHOST;
        }
    }
    logger.info('UDP server is binding to address:', config.address);

    if (isIPv6()) {
        ipv6 = true;
        udpVersion = 'udp6';
    }

    logger.info('UDP server is using:', udpVersion);

    if (!Array.isArray(config.portRange) || config.portRange.length < 1) {
        logger.error(
            'incorrect port range',
            '(must be an array of 1 elements from smallest to biggest):',
            config.portRange
        );
        throw new Error('<PORT_RANGE_FOR_UDP_SERVER_INCORRECT>');
    }

    router.setup();

    var running = false;
    var ports = [];
    var portIndex = 0;
    var boundPort;

    var done = function __udpSetupDone() {
        // UDP server is now successfully bound and listening
        boundPort = ports[portIndex];
        // gracenode shutdown task
        gn.onExit(function UDPShutdown(next) {

            shutdown = true;

            if (!running) {
                logger.info(
                    'UDP server not running yet [skip]:',
                    config.address + ':' + boundPort
                );
                return next();
            }

            logger.info(
                'UDP server closing',
                config.address + ':' + boundPort
            );

            server.close();

            next();
        });

        running = true;
        server.on('message', handleMessage);
        
        var info = server.address();

        connectionInfo.address = info.address;
        connectionInfo.host = config.address;
        connectionInfo.port = info.port;
        connectionInfo.family = info.family;
    
        setupCleaning();
    
        logger.info('UDP server started at', info.address + ':' + info.port, connectionInfo.family);
        logger.info('using encryption:', (cryptoEngine.encrypt ? true : false));
        logger.info('using decryption:', (cryptoEngine.decrypt ? true : false));

        cb();
    };
    var listen = function __udpSetupListen() {
        
        if (server) {
            server.close();
        }

        var port = ports[portIndex];
        logger.verbose('binding to:', config.address + ':' + port);
        // create UDP server
        server = dgram.createSocket(udpVersion);
        server.on('error', handleError);
        server.on('listening', done);
        server.bind({
            port: port,
            address: config.address,
            // make sure all workers do NOT share the same port
            exclusive: true
        });
    };
    var handleError = function __udpHandleError(error) {
        if (error.code === PORT_IN_USE) {
            // try next port in range
            var badPort = ports[portIndex];
            logger.verbose('port is in use:', badPort);
            portIndex += 1;
            if (!ports[portIndex]) {
                // there's no more port in range
                error.message += ' (port:' + badPort + ')';
                return gn.stop(error);
            }
            return listen();
        }
        gn.stop(error);
    };

    var pend = config.portRange[1] || config.portRange[0];

    for (var p = config.portRange[0]; p <= pend; p++) {
        ports.push(p);
    }

    logger.verbose(
        'port range is',
        config.portRange[0],
        'to',
        pend
    );

    listen();
};

module.exports.onError = function __udpOnError(cb) {
    onErrorHandler = cb;
};

module.exports.useEncryption = function __udpUseEncryption(encrypt) {
    if (typeof encrypt !== 'function') {
        throw new Error('EncryptMustBeFunction');
    }
    cryptoEngine.encrypt = encrypt;
};

module.exports.useDecryption = function __udpUseDecryption(decrypt) {
    if (typeof decrypt !== 'function') {
        throw new Error('DecryptMustBeFunction');
    }
    cryptoEngine.decrypt = decrypt;
};

module.exports.getCommandList = function () {
    return router.getCommandList();
};

// assign a handler function to a command
module.exports.command = function __udpCommand(cmdId, commandName, handler) {
    router.define(cmdId, commandName, handler);
};

// assign a command hook function
module.exports.hook = function __udpHook(cmdIdList, handler) {
    if (typeof cmdIdList === 'function') {
        hooks.add(cmdIdList);
        return;
    }
    // cmdIdList can contain command names instead of command IDs
    cmdIdList = router.getIdsByNames(cmdIdList);
    hooks.add(cmdIdList, handler);
};

// send server push UDP message to user defined address and port
// msg must be a buffer
/*
options {
    // used for encryption
    session: <session object>
}
*/
module.exports.push = function (msg, address, port, cb, options) {
    serverPush(msg, address, port, cb, options);
};

// send server push UDP message to multiple users
// msg must be a buffer
// list = [ { address, port } { ... } ];
module.exports.multipush = function (msg, list, cb, options) {
    var sender = function __multipushUdpSender() {
        var dest = list.shift();
        if (dest) {
            module.exports.push(msg, dest.address, dest.port, next, options);
            return;
        }
        // done
        if (typeof cb === 'function') {
            cb();
        }
    };
    var next = function __multipushUdpNext() {
        process.nextTick(sender);
    };
    next();
};

function handleMessage(buff, rinfo) {

    if (rinfo.port <= 0 || rinfo.port > 65536) {
        logger.error('malformed packet received from invalid port (packet ignored):', rinfo, buff);
        return;
    }

    if (buff[0] === PING_MSG[0] &&
        buff[1] === PING_MSG[1] &&
        buff[2] === PING_MSG[2] &&
        buff[3] === PING_MSG[3]
    ) {
        server.send(PONG_MSG, 0, PONG_MSG.length, rinfo.port, rinfo.address);    
        return;
    }    

    var key = rinfo.address + rinfo.port;

    if (!clientMap[key]) {
        clientMap[key] = {
            time: 0
        };
    }
    clientMap[key].time = gn.lib.now();

    var parsed = transport.parse(buff);

    if (!parsed) {
        // invalid packet
        return;
    }
    
    if (parsed instanceof Error) {
        logger.error(parsed);
        dispatchOnError(parsed);
        return;
    }
    
    var params = {
        buff: buff,
        rinfo: rinfo
    };
    async.loopSeries(parsed.payloads, params, _onEachMessage);
}

function _onEachMessage(payloadData, params, next) {
    var decrypt = cryptoEngine.decrypt;
    if (decrypt) {
        var pudp = gn.session.PROTO.UDP;
        var addr = params.rinfo.address;
        var port = params.rinfo.port;
        var toDecrypt = params.buff;
        if (!transport.isJson()) {
            toDecrypt = payloadData.payload;
        }
        decrypt(toDecrypt, pudp, addr, port, _onEachDecrypt.bind(null, {
            payloadData: payloadData,
            params: params,
            next: next
        }));
        return;
    }
    if (payloadData.seq >= 0xffff) {
        payloadData.seq = 0;
    } 
    executeCmd(null, payloadData.seq, null, payloadData, params.rinfo);
    next();
}

function _onEachDecrypt(bind, error, sid, seq, sdata, dec) {
    var payloadData = bind.payloadData;
    var params = bind.params;
    var next = bind.next;
    if (error) {
        // this is also the same as session failure
        logger.error('decryption of message failed:', error);
        dispatchOnError(new Error('DecryptionFailed'));
        return;
    }
    payloadData.payload = dec;
    // route and execute command
    executeCmd(sid, seq, sdata, payloadData, params.rinfo);
    next();
}

function dispatchOnError(error) {
    if (typeof onErrorHandler === 'function') {
        onErrorHandler(error);
    }
}

function executeCmd(sessionId, seq, sessionData, msg, rinfo) {
    var cmd = router.route(msg);    
    
    if (!cmd) {
        logger.error('command not found:', msg);
        dispatchOnError(new Error('CommandNotFound'));
        return;
    }

    var payload = config.supportJSON ?
        _getPayloadFromJSON(msg.payload) : msg.payload;

    var state = {
        cmd: cmd,
        STATUS: transport.STATUS,
        sessionId: sessionId,
        seq: seq,
        session: sessionData,
        clientAddress: rinfo.address,
        clientPort: rinfo.port,
        payload: payload,
        send: null
    };
    
    state.send = _sender.bind(null, {
        state: state,
        seq: seq
    });

    cmd.hooks(msg, state, _onHooksFinished.bind(null, {
        cmd: cmd,
        state: state
    }));
}

function _sender(bind, msg, status, cb) {
    var state = bind.state;
    var seq = bind.seq;
    send(state, msg, seq, status, cb);
}

function _onHooksFinished(bind, error) {
    if (error) {
        dispatchOnError(error);
        return;
    }
    executeCommands(bind.cmd, bind.state);
}

function _getPayloadFromJSON(payload) {
    try {
        return JSON.parse(payload);
    } catch (e) {
        return payload;
    }
}

function executeCommands(cmd, state) {
    var params = { state: state };
    async.loopSeries(cmd.handlers, params, _onEachCommand);

}

function _onEachCommand(handler, params, next) {
    handler(params.state, next);
}

function send(state, msg, seq, status, cb) {

    if (shutdown) {
        return;
    }

    // consider this as a reply
    if (status !== undefined && status !== null) {
        msg = transport.createReply(status, seq || 0, msg);
    } else {
        // otherwise push
        msg = transport.createPush(seq || 0, msg);
    }

    if (cryptoEngine.encrypt) {
        cryptoEngine.encrypt(
            state,
            msg,
            _onSendEncrypt.bind(null, {
                state: state,
                sent: _onSent
            })
        );
        return;
    }

    server.send(
        msg,
        0,
        msg.length,
        state.clientPort,
        state.clientAddress,
        _onSent.bind(null, {
            state: state,
            cb: cb
        })
    );
}

function _onSendEncrypt(bind, error, encrypted) {
    var state = bind.state;
    var sent = bind.sent;
    var cb = bind.cb;
    if (error) {
        logger.error(
            'encryption of message failed:',
            state.sessionId,
            state.seq,
            error
        );
        return dispatchOnError(new Error('EncryptionFailed'));
    }
    server.send(
        encrypted,
        0,
        encrypted.length,
        state.clientPort,
        state.clientAddress,
        sent.bind(null, {
            state: state,
            cb: cb
        })
    );
}

function _onSent(bind, error) {
    var state = bind.state;
    var cb = bind.cb;
    if (error) {
        logger.error(
            'sending UDP packet failed:',
            error,
            'to:', state.clientAddress + ':' +
            state.clientPort
        );
        if (typeof cb === 'function') {
            cb(error);
        }
        return dispatchOnError(error);
    }
    if (typeof cb === 'function') {
        cb();
    }
}

function serverPush(msg, address, port, cb, options) {

    if (shutdown) {
        return;
    }

    if (typeof cb === 'object' && cb !== null) {
        options = cb;
        cb = null;
    }

    if (typeof cb !== 'function') {
        cb = _nothing;
    }
    
    msg = transport.createPush(0, msg);

    // we encrypt push packet ONLY if options.session is provided with encryption enabled
    if (cryptoEngine.encrypt && options && options.session) {
        cryptoEngine.encrypt(
            { session: options.session },
            msg,
            _onPushEncrypt.bind(null, {
                address: address,
                port: port,
                cb: cb
            })
        );
        return;
    }

    server.send(msg, 0, msg.length, port, address, cb);
}

function _onPushEncrypt(bind, error, encrypted) {
    var address = bind.address;
    var port = bind.port;
    var cb = bind.cb;
    if (error) {
        logger.error(
            'failed to encrypt packet for push',
            address,
            port
        );
        return cb();
    }
    server.send(encrypted, 0, encrypted.length, port, address, cb);
}

function isIPv6() {
    return config.address === '::0' || config.address.indexOf(IPV6_ADDR_PREFIX) === 0;
}

function findAddrMap() {
    var map = {
        ipv4: {},
        ipv6: {}
    };
    for (var interfaceName in neti) {
        var list = neti[interfaceName];
        for (var i = 0, len = list.length; i < len; i++) {
            var fam = list[i].family.toLowerCase();
            var addr = list[i].address;
            if (fam === IPv6 && addr.indexOf(IPV6_ADDR_PREFIX) === 0) {
                map.ipv6[interfaceName] = addr + '%' + interfaceName;
            } else if (fam === IPv4) {
                map.ipv4[interfaceName] = addr;
            }
        }
    }
    return map;
}

function setupCleaning() {
    var clean = function () {
        try {
            var now = gn.lib.now() - CLEAN_INTERVAL;
            for (var key in clientMap) {
                if (now >= clientMap[key].time) {
                    delete clientMap[key];
                }
            }
        } catch (error) {
            logger.error('cleaning error:', error);
        }
        setTimeout(clean, CLEAN_INTERVAL);
    };
    setTimeout(clean, CLEAN_INTERVAL);
}

function _nothing() {

}


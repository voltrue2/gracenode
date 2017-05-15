'use strict';

/**
* FIXME: TCP protocol is currently unstable is should not be used... :(
* The issue with TCP is that
* managing the number of open sockets asynchronously turns out to be tough
*/

const async = require('async');
const gn = require('../gracenode');
const packer = require('./packer');
const meshNodes = require('./meshnodes');
const tcp = require('./tcp');
const udp = require('./udp');

const TCP = 0;
const UDP = 1;
const PTS = '_pts';
const PTRS = '_ptr';
const PTRES = '_pte';
// should we make it configurable?
const RES_TIMEOUT = 10000;

const handlers = {};
const responses = {};
const _info = [];
var logger;

packer.schema(PTS, {
	id: packer.TYPE.UUID,
	hasResponse: packer.TYPE.BOOL,
	protocol: packer.TYPE.UINT8,
	eventName: packer.TYPE.STR,
	nodes: packer.TYPE.BIN,
	payload: packer.TYPE.BIN
});
packer.schema(PTRS, {
	id: packer.TYPE.UUID,
	eventName: packer.TYPE.STR,
	payload: packer.TYPE.BIN,
	isError: packer.TYPE.BOOL
});
packer.schema(PTRES, {
	message: packer.TYPE.ERR
});

module.exports = {
	TCP: TCP,
	UDP: UDP,
	config: config,
	setup: setup,
	send: send,
	receive: receive,
	info: info,
	_RES_SCHEMA_SUFFIX: ''
};

function config(_conf) {
	logger = gn.log.create('portal.broker.delivery');
	tcp.config(_conf);
	udp.config(_conf);
}

function setup(cb) {
	//tcp.on(_onRemoteReceive);
	udp.on(_onRemoteReceive);
	async.series([
		//tcp.setup,
		udp.setup,
		__getInfo
	], cb);

	function __getInfo(next) {
		//_info[TCP] = tcp.info();
		_info[UDP] = udp.info();
		next();
	}
}

function info(protocol) {
	switch (protocol) {
		case TCP:
			return _info[protocol];
		case UDP:
			return _info[protocol];
		default:
			// tcp and udp can bind to the same port anyways...
			return _info[UDP];
	}
}

function send(protocol, eventName, nodes, data, cb) {
	const node = nodes.shift();
	if (!node) {
		// no where to send payload to...
		return;
	}
	const addr = node.address;
	const port = node.port;
	const me = info();

	const isLocal = addr === me.address && port === me.port;
	if (!addr || isNaN(port)) {
		logger.error(
			'Invalid address/port to emit:',
			node,
			'event:', eventName
		);
		return;
	}

	logger.debug(
		'Emitting to:', addr, port,
		'event:', eventName,
		'is local:', isLocal,
		'protocol (TCP=0 UDP=1):', protocol,
		'response:', cb ? true : false,
		'payload data:', data
	);

	// determine local send or remote send
	if (isLocal) {
		_onLocalReceive(
			protocol,
			eventName,
			nodes,
			data,
			cb
		);
		return;
	}

	const id = gn.lib.uuid.v4();
	const packed = packer.pack(PTS, {
		id: id.toBytes(),
		hasResponse: cb ? true : false,
		protocol: protocol,
		eventName: eventName,
		nodes: meshNodes.toBytes(nodes),
		payload: packer.pack(eventName, data)
	});
	if (typeof cb === 'function') {
		const idStr = id.toString();
		const timeout = _createResponseTimeout(
			idStr,
			eventName,
			cb
		);
		responses[idStr] = {
			callback: cb,
			timeout: timeout
		};
	}

	setImmediate(__send);
	
	function __send() {
		switch (protocol) {
			case TCP:
				tcp.emit(
					addr,
					port,
					packed
				);	
			break;
			case UDP:
				udp.emit(
					addr,
					port,
					packed
				);
			break;
			default:
				logger.error(
					'Invalid protocol for remote send:',
					protocol,
					addr, port
				);
			break;
		}
	}
}

function _createResponseTimeout(id, eventName, cb) {
	const timeout = setTimeout(__onTimeout, RES_TIMEOUT);
	
	function __onTimeout() {
		logger.error(
			'Response timed out:',
			id,
			eventName
		);
		delete responses[id];
		// TODO: send an error packet or something...
		cb(new Error('PortalResponseTimeout:' + eventName));
	}
	return timeout;
}

function receive(eventName, handler) {
	if (!handlers[eventName]) {
		handlers[eventName] = [];
	}
	handlers[eventName].push(handler);
}

function _onLocalReceive(protocol, eventName, nodes, data, cb) {
	if (!handlers[eventName]) {
		return;
	}
	const resp = _createLocalResponse(cb);
	const _handlers = handlers[eventName];
	for (var i = 0, len = _handlers.length; i < len; i++) {
		_handlers[i](data, resp);
	}
	if (nodes.length) {
		logger.debug(
			'Emitting relay from local:',
			'protocol (TCP=0 UDP=1)', protocol,
			'event', eventName,
			'payload data', data
		);
		send(
			protocol,
			eventName,
			nodes,
			data
		);			
	}
}

function _createLocalResponse(cb) {
	function __onLocalResponse(res) {
		if (res instanceof Error) {
			return cb(res);
		}
		cb(null, res);
	}
	return __onLocalResponse;
}

function _onRemoteReceive(packed, response) {
	const unpacked = packer.unpack(PTS, packed);
	if (unpacked) {
		if (!handlers[unpacked.eventName]) {
			return;
		}
		unpacked.nodes = meshNodes.toList(unpacked.nodes);
		const _handlers = handlers[unpacked.eventName];
		for (var i = 0, len = _handlers.length; i < len; i++) {
			_callHandler(unpacked, _handlers[i], response);
		}
		return;
	}
	// is packed a response?
	const res = packer.unpack(PTRS, packed);
	logger.debug('Handle response:', res);
	if (res && responses[res.id]) {
		try {
			clearTimeout(responses[res.id].timeout);
			var rname;
			if (res.isError) {
				rname = PTRES;
			} else {
				rname = res.eventName +
				module.exports._RES_SCHEMA_SUFFIX;
			}
			const resData = packer.unpack(rname, res.payload);
			logger.debug(
				'Invoke response callback:',
				res.id, resData
			);
			if (res.isError) {
				responses[res.id].callback(resData.message);
			} else {
				responses[res.id].callback(null, resData);
			}
		} catch (err) {
			logger.error('Response error:', err);
		}
		delete responses[res.id];
		return;
	}
	logger.debug('Response callback not found:', res, packed);
}

function _callHandler(unpacked, handler, response) {
	setImmediate(__callHandler);

	function __callHandler() {
		const data = packer.unpack(
			unpacked.eventName,
			unpacked.payload
		);
		logger.debug(
			'Handled event:', unpacked.eventName,
			'protocol (TCP=0 UDP=1)', unpacked.protocol,
			'id', unpacked.id.toString('hex'),
			'requires response',
			response ? true : false,
			'payload data:', data
		);
		if (response && unpacked.hasResponse) {
			handler(data, __response);
		} else {
			handler(data);
		}
		if (unpacked.nodes.length) {
			logger.debug(
				'Emitting relay:',
				'protocol (TCP=0 UDP=1)', unpacked.protocol,
				'event', unpacked.eventName,
				'payload data', data
			);
			send(
				unpacked.protocol,
				unpacked.eventName,
				unpacked.nodes,
				data
			);			
		}
	}

	function __response(data) {
		const isError = data instanceof Error ? true : false;
		var rname;
		if (isError) {
			rname = PTRES;	
		} else {
			rname = unpacked.eventName +
				module.exports._RES_SCHEMA_SUFFIX;
		}
		logger.debug(
			'Calling response:',
			'as error?', isError,
			unpacked.id,
			unpacked.eventName,
			'pack data name', rname,
			data
		);
		if (!packer.schemaExists(rname)) {
			logger.error(
				'Event response data structure missing:',
				unpacked.eventName,
				rname
			);
			return;
		}
		const res = packer.pack(rname, data);
		const resPacked = packer.pack(PTRS, {
			id: unpacked.id,
			eventName: unpacked.eventName,
			payload: res,
			isError: isError
		});
		response(resPacked);
	}
}


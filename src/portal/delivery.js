'use strict';

const gn = require('../gracenode');
const async = gn.async;
const packer = require('./packer');
const meshNodes = require('./meshnodes');
const udp = require('./udp');

const RUDP = 0;
const UDP = 1;
const RES_BYTES = gn.Buffer.alloc(4);
RES_BYTES[0] = 0xde;
RES_BYTES[1] = 0xaf;
RES_BYTES[2] = 0xbe;
RES_BYTES[3] = 0xed;

const handlers = {};
const responses = {};
const _info = [];

var logger;
var _sendHandler;

module.exports = {
	RUDP: RUDP,
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
	udp.config(_conf);
	_sendHandler = _send;
	udp.onTimeOut(_onTimeOut);
}

function setup(cb) {
	var tasks;
	udp.on(_onRemoteReceive);
	tasks = [
		udp.setup,
		__getInfo
	];
	async.series(tasks, cb);
	function __getInfo(next) {
		_info[RUDP] = udp.info();
		_info[UDP] = udp.info();
		next();
	}
}

function info(protocol) {
	switch (protocol) {
		case RUDP:
			return _info[protocol];
		case UDP:
			return _info[protocol];
		default:
			// tcp and udp can bind to the same port anyways...
			return _info[UDP];
	}
}

function send(protocol, eventName, nodes, data, cb) {
	var node = nodes.shift();
	if (!node) {
		// no where to send payload to...
		return;
	}
	var addr = node.address;
	var port = node.port;
	var me = info();
	var isSelf = false;
	
	if (!addr || isNaN(port)) {
		logger.error(
			'Invalid address/port to emit:',
			node,
			'event:', eventName
		);
		return;
	}
	
	if (addr === me.address) {
		if (port === me.port) {
			isSelf = true;
		}
	}

	var hasResponse = false;
	if (typeof cb === 'function') {
		hasResponse = true;
	}

	logger.sys(
		'Emitting to:', addr, port,
		'event:', eventName,
		'is self:', isSelf,
		'protocol (RUDP=0 UDP=1):', protocol,
		'response:', hasResponse,
		'payload data:', data
	);

	// determine self send or remote send
	if (isSelf) {
		_onSelfReceive(
			protocol,
			eventName,
			nodes,
			data,
			cb
		);
		return;
	}

	var id = gn.lib.uuid.v4();
	var packed = packer.pack({
		id: id.toBytes(),
		hasResponse: hasResponse,
		protocol: protocol,
		eventName: eventName,
		nodes: meshNodes.toBytes(nodes),
		payload: data
	});
	if (hasResponse) {
		logger.sys('Response callback set as ID', id.toString());
		responses[id.toString()] = {
			callback: cb
		};
	}
	_sendHandler(protocol, addr, port, packed);
}

function _send(protocol, addr, port, packed) {
	switch (protocol) {
		case RUDP:
			udp.remit(
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

function receive(eventName, handler) {
	if (!handlers[eventName]) {
		handlers[eventName] = [];
	}
	handlers[eventName].push(handler);
}

function _onSelfReceive(protocol, eventName, nodes, data, cb) {
	if (!handlers[eventName]) {
		return;
	}
	var resp = _onSelfResponse.bind({ cb: cb });
	var _handlers = handlers[eventName];
	for (var i = 0, len = _handlers.length; i < len; i++) {
		_handlers[i](data, resp);
	}
	if (nodes.length) {
		logger.sys(
			'Emitting relay from self:',
			'protocol (RUDP=0 UDP=1)', protocol,
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

function _onTimeOut(packet) {
	if (_isResponsePacket(packet)) {
		// we do not re-deliver response:
		// b/c a response must be delivered to a specific node...
		return;
	}
	var unpacked = packer.unpack(packet);
	var nodes = meshNodes.toList(unpacked.nodes);
	if (!nodes.length) {
		// no nodes to re-delivery...
		return;
	}
	// re-deliver to another node
	logger.sys(
		'Re-deliver message:',
		'event', unpacked.eventName,
		'payload data', unpacked.payload
	);
	send(
		unpacked.protocol,
		unpacked.eventName,
		nodes,
		unpacked.payload
	);
}

function _onSelfResponse(res) {
	var cb = this.cb;
	if (res instanceof Error) {
		return cb(res);
	}
	cb(null, res);
}

function _onRemoteReceive(packed, _response) {
	var response = _response || this.response;
	if (_isResponsePacket(packed)) {
		// response
		packed = packed.slice(4);
		var res = packer.unpack(packed);
		res.id = res.id.toString('hex');
		logger.sys('Handle response:', res);
		if (res && responses[res.id]) {
			var resData = res.payload;
			logger.sys(
				'Invoke response callback:',
				res.id, resData
			);
			if (res.isError) {
				responses[res.id].callback(resData.message);
			} else {
				responses[res.id].callback(null, resData);
			}
			delete responses[res.id];
			return;
		}
		logger.sys('Response callback not found:', res, packed);
		return;
	}
	// non response
	var unpacked = packer.unpack(packed);
	unpacked.nodes = meshNodes.toList(unpacked.nodes);
	if (unpacked.nodes.length) {
		logger.sys(
			'Emitting relay:',
			'protocol (RUDP=0 UDP=1)', unpacked.protocol,
			'event', unpacked.eventName,
			'payload data', unpacked.payload
		);
		send(
			unpacked.protocol,
			unpacked.eventName,
			unpacked.nodes,
			unpacked.payload
		);			
	}
	if (!handlers[unpacked.eventName]) {
		return;
	}
	var _handlers = handlers[unpacked.eventName];
	for (var i = 0, len = _handlers.length; i < len; i++) {
		_callHandler(unpacked, _handlers[i], response);
	}
}

function _callHandler(unpacked, handler, response) {
	logger.sys(
		'Handled event:', unpacked.eventName,
		'protocol (RUDP=0 UDP=1)', unpacked.protocol,
		'id', unpacked.id.toString('hex'),
		'requires response',
		response ? true : false,
		'payload data:', unpacked.payload
	);
	if (response && unpacked.hasResponse) {
		handler(unpacked.payload, _onHandlerResponse.bind({
			unpacked: unpacked,
			response: response
		}));
	} else {
		handler(unpacked.payload);
	}
}

function _onHandlerResponse(data) {
	var isError = data instanceof Error ? true : false;
	var unpacked = this.unpacked;
	var response = this.response;
	logger.sys(
		'Calling response:',
		'as error?', isError,
		unpacked.id,
		unpacked.eventName,
		data
	);
	var resPacked = packer.pack({
		id: unpacked.id,
		eventName: unpacked.eventName,
		payload: data,
		isError: isError
	});
	response(Buffer.concat([ RES_BYTES, resPacked ]));
}

function _isResponsePacket(packet) {
	if (
		packet[0] === RES_BYTES[0] &&
		packet[1] === RES_BYTES[1] &&
		packet[2] === RES_BYTES[2] &&
		packet[3] === RES_BYTES[3]
	) {
		return true;
	}
	return false;
}


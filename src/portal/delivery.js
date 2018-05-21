'use strict';

const gn = require('../gracenode');
const async = gn.async;
const packer = require('./packer');
const meshNodes = require('./meshnodes');
const ipc = require('./ipc');
const tcp = require('./tcp');
const udp = require('./udp');

const TCP = 0;
const UDP = 1;
const RES_BYTES = gn.Buffer.alloc(4);
RES_BYTES.writeUInt32BE(0x01020304);
const RES_BYTES_VAL = RES_BYTES.readUInt32BE(0);

const handlers = {};
const responses = {};
const _info = [];

var logger;
var _sendHandler;

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
	ipc.config(_conf);
	_sendHandler = _send;
}

function setup(cb) {
	var tasks;
	tcp.on(_onRemoteReceive);
	udp.on(_onRemoteReceive);
	ipc.on(_onRemoteReceive);
	tasks = [
		tcp.setup,
		udp.setup,
		ipc.setup,
		__getInfo
	];
	async.series(tasks, cb);
	function __getInfo(next) {
		_info[TCP] = tcp.info();
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
	var node = nodes.shift();
	if (!node) {
		// no where to send payload to...
		return;
	}
	var addr = node.address;
	var port = node.port;
	var me = info();
	var isSelf = false;
	var isLocal = false;
	
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
		} else {
			isLocal = true;
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
		'is local:', isLocal,
		'protocol (TCP=0 UDP=1):', protocol,
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
		payload: packer.pack(data)
	});
	if (hasResponse) {
		logger.sys('Response callback set as ID', id.toString());
		responses[id.toString()] = {
			callback: cb
		};
	}
	_sendHandler(protocol, isLocal, addr, port, packed);
}

function _send(protocol, isLocal, addr, port, packed) {
	
	// same server different process
	if (isLocal) {
		ipc.emit(
			addr,
			port,
			packed
		);
		return;
	}

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

function _onSelfResponse(res) {
	var cb = this.cb;
	if (res instanceof Error) {
		return cb(res);
	}
	cb(null, res);
}

function _onRemoteReceive(buf, response) {
	__onRemoteReceive(buf, null, response);
}

function __onRemoteReceive(packed, next, _response) {
	var response = _response || this.response;
	if (RES_BYTES_VAL === packed.readUInt32BE(0)) {
		// response
		packed = packed.slice(4);
		var res = packer.unpack(packed);
		res.id = res.id.toString('hex');
		logger.sys('Handle response:', res);
		if (res && responses[res.id]) {
			var resData = packer.unpack(res.payload);
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
			return _callNext(next);
		}
		logger.sys('Response callback not found:', res, packed);
		return _callNext(next);
	}
	// non response
	var unpacked = packer.unpack(packed);
	if (!handlers[unpacked.eventName]) {
		return _callNext(next);
	}
	unpacked.nodes = meshNodes.toList(unpacked.nodes);
	var _handlers = handlers[unpacked.eventName];
	for (var i = 0, len = _handlers.length; i < len; i++) {
		_callHandler(unpacked, _handlers[i], response);
	}
	_callNext(next);
}

function _callNext(next) {
	if (!next) {
		return;
	}
	process.nextTick(next);
}

function _callHandler(unpacked, handler, response) {
	var data = packer.unpack(unpacked.payload);
	logger.sys(
		'Handled event:', unpacked.eventName,
		'protocol (TCP=0 UDP=1)', unpacked.protocol,
		'id', unpacked.id.toString('hex'),
		'requires response',
		response ? true : false,
		'payload data:', data
	);
	if (response && unpacked.hasResponse) {
		handler(data, _onHandlerResponse.bind({
			unpacked: unpacked,
			response: response
		}));
	} else {
		handler(data);
	}
	if (unpacked.nodes.length) {
		logger.sys(
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
	var res = packer.pack(data);
	var resPacked = packer.pack({
		id: unpacked.id,
		eventName: unpacked.eventName,
		payload: res,
		isError: isError
	});
	response(Buffer.concat([ RES_BYTES, resPacked ]));
}


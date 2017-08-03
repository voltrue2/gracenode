'use strict';

const _Buffer = require('../../src/buffer');
var COUNT_SIZE = 1;
var EPOS_SIZE = 2;
var HEADER_SIZE = COUNT_SIZE;

module.exports.parse = function __transportPbufParse(buf) {
	// get all packets in binary
	var packets = _Buffer.alloc(buf.length - HEADER_SIZE);
	buf.copy(packets, 0, HEADER_SIZE);
	// packet count
	var packetCount = buf.readUInt8(0);
	// read packets
	var offset = HEADER_SIZE;
	var list = [];
	while (packetCount) {
		// packet size
		var psize = buf.readUInt16BE(offset);
		offset += EPOS_SIZE;
		// packet
		var packet = _Buffer.alloc(psize);
		buf.copy(packet, 0, offset);
		// update offset
		offset += psize;
		// update list
		list.push(packet);
		// update packetCount
		packetCount -= 1;
	}
	return {
		payload: packets,
		packets: list
	};
};

module.exports.create = function __transportPbufCreate(packets) {
	// packets must be an array
	if (!Array.isArray(packets)) {
		packets = [ packets ];
	}
	// calculate packet size
	var total = 0;
	for (var j = 0, jen = packets.length; j < jen; j++) {
		packets[j] = createPacket(packets[j]);
		total += EPOS_SIZE + packets[j].length;
	}
	// create packet buffer
	var buf = _Buffer.alloc(HEADER_SIZE + total);
	// add packet count
	buf.writeUInt8(packets.length, 0);
	// add packets
	var offset = HEADER_SIZE;
	for (var i = 0, len = packets.length; i < len; i++) {
		var packet = packets[i];
		// packet size
		var psize = packet.length;	
		buf.writeUInt16BE(psize, offset);
		offset += EPOS_SIZE;
		// add packet
		if (typeof packet === 'string') {
			buf.write(packet, offset);
		} else {
			packet.copy(buf, offset);
		}
		// update offset
		offset += psize;
	}
	return buf;
};

function createPacket(data) {
	if (data === null || data === undefined) {
		return '';
	} else if (typeof data === 'string' || Buffer.isBuffer(data)) {
		return data;
	} else {
		return _Buffer.alloc(JSON.stringify(data));
	}
}

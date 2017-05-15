'use strict';

module.exports = {
	toBytes: toNodeListBytes,
	toList: toNodeList,
	addrAndPortToBytes: addrAndPortToBytes,
	bytesToAddrAndPort: bytesToAddrAndPort
};

function toNodeListBytes(nodeList) {
	const list = [];
	for (var i = 0, len = nodeList.length; i < len; i++) {
		var bytes = addrAndPortToBytes(
			nodeList[i].address,
			nodeList[i].port
		);
		list.push(bytes);
	}
	return Buffer.concat(list);
}

function toNodeList(bytes) {
	if (!bytes) {
		return [];
	}
	const list = [];
	const len = bytes.length;
	// there should NOT be any remainder but if the packet
	// is corrupt it could happen and we do NOT want to hang
	for (var i = 0; i <= len; i += 6) {
		var buf = bytes.slice(i, i + 6);
		var res = bytesToAddrAndPort(buf);
		if (res) {
			list.push(res);
		}
	}
	return list;
}

// addr MUST be an IP address NOT hostname
// returns 6-byte binary 
function addrAndPortToBytes(addr, port) {
	if (!addr && !port) {
		return new Buffer(0);
	}
	const list = addr.split('.');
	// 4 bytes = address 2 bytes = port
	const buf = new Buffer(6);
	for (var i = 0, len = list.length; i < len; i++) {
		buf.writeUInt8(parseInt(list[i]), i);
	}
	buf.writeUInt16BE(port, 4);
	return buf;
}

function bytesToAddrAndPort(buf) {
	if (!buf || buf.length < 6) {
		return {
			address: null,
			port: 0
		};
	}
	const list = [];
	// first 4 bytes are for address
	for (var i = 0; i < 4; i++) {
		list.push(buf.readUInt8(i));
	}
	// last 2 bytes are port
	const port = buf.readUInt16BE(4);
	// now return
	return {
		address: list.join('.'),
		port: port
	};
}


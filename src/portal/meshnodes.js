'use strict';

const gn = require('../gracenode');

module.exports = {
	toBytes: toNodeListBytes,
	toList: toNodeList,
	addrAndPortToBytes: addrAndPortToBytes,
	bytesToAddrAndPort: bytesToAddrAndPort
};

function toNodeListBytes(nodeList) {
	var list = [];
	for (var i = 0, len = nodeList.length; i < len; i++) {
		var bytes = addrAndPortToBytes(
			nodeList[i].address,
			nodeList[i].port
		);
		var byteSize = gn.Buffer.alloc(1);
		byteSize.writeUInt8(bytes.length);
		list.push(byteSize);
		list.push(bytes);
	}
	return Buffer.concat(list);
}

function toNodeList(bytes) {
	if (!bytes) {
		return [];
	}
	var list = [];
	var len = bytes.length;
	var consumed = 0;
	while (consumed < len) {
		var byteSize = bytes.readUInt8(consumed);
		var fragmentBytes = gn.Buffer.alloc(byteSize);
		consumed += 1;
		bytes.copy(fragmentBytes, 0, consumed, consumed + byteSize);
		list.push(bytesToAddrAndPort(fragmentBytes));
		consumed += byteSize; 
	}
	return list;
}

// addr CAN be an IP address OR a hostname
// it supports IPv6 addresses
function addrAndPortToBytes(addr, port) {
	if (!addr && !port) {
		return gn.Buffer.alloc(0);
	}
	var portBuf = gn.Buffer.alloc(2);
	portBuf.writeUInt16BE(port, 0);
	var addrBuf = gn.Buffer.alloc(addr);
	return Buffer.concat([ portBuf, addrBuf ]);
}

function bytesToAddrAndPort(buf) {
	if (!buf || buf.length < 6) {
		return {
			address: null,
			port: 0
		};
	}
	return {
		port: buf.readUInt16BE(0),
		address: buf.slice(2).toString()
	};
}


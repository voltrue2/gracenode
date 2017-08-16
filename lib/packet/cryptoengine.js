'use strict';

const _Buffer = require('../../src/buffer');
const crypto = require('crypto');
const uuid = require('../uuid');

const AES_CBC = 'aes-256-cbc';
// uuid v4 in raw 128bits binary
const TOKEN_LEN = 16;
// uint32
const SEQ_LEN = 4;
// SHA-256
const MAC_LEN = 32;
// output packet header size
const OH_LEN = SEQ_LEN + MAC_LEN;
// token (session ID) + seq length
const TS_LEN = TOKEN_LEN + SEQ_LEN;
// assumes zero layload
const MIN_PACKET_LEN = TOKEN_LEN + SEQ_LEN + MAC_LEN;

function CryptoEngine() {

}

// static constants
CryptoEngine.CIPHER_KEY_LEN = 16;
CryptoEngine.CIPHER_NOUNCE_LEN = 8;
CryptoEngine.MAC_KEY_LEN = MAC_LEN;

CryptoEngine.createCipher = function __ceCreateCipher() {
	return {
		cipherKey: crypto.randomBytes(32),
		// cipherNonce is used as IV
		cipherNonce: crypto.randomBytes(16),
		macKey: crypto.randomBytes(32),
		seq: 0
	};
};

// static version of getSessionIdAndPayload
CryptoEngine.getSessionIdAndPayload = function __staticGetSessionIdAndPayload(payload) {
	if (payload.length < MIN_PACKET_LEN) {
		return new Error('InvalidPacket');
	}

	var sessionId = uuid.create(payload.slice(0, TOKEN_LEN)).toString();
	var seq = payload.readUInt32BE(TOKEN_LEN, TS_LEN);

	return {
		sessionId: sessionId,
		seq: seq,
		payload: payload.slice(TS_LEN)
	};
};

// static version of decrypt
CryptoEngine.decrypt = function __staticDecrypt(sid, _cipher, seq, payload) {
	var key = toBuffer(_cipher.cipherKey);
	var len = payload.length - MAC_LEN;
	var payloadToSign = payload.slice(0, len);
	var cipherText = payload.slice(SEQ_LEN, len);
	var clientHmac = payload.slice(len);

	// calculate signature and compare
	var hmacSha = crypto.createHmac('sha256', toBuffer(_cipher.macKey));
	hmacSha.update(payloadToSign);
	var mac = hmacSha.digest();
	if (!mac.equals(clientHmac)) {
		return new Error('BadSignature');
	}
	return cbc(
		crypto.createDecipheriv(
			AES_CBC,
			key,
			toBuffer(_cipher.cipherNonce)
		),
		cipherText
	);
};

// static version of encrypt
CryptoEngine.encrypt = function __staticEncrypt(sid, _cipher, seq, payload) {
	var key = toBuffer(_cipher.cipherKey);
	var cipherText = cbc(
		crypto.createCipheriv(
			AES_CBC,
			key,
			toBuffer(_cipher.cipherNonce)
		),
		payload
	);
	// OH_LEN = SEQ_LEN + MAC_LEN
	var outpacket = _Buffer.alloc(cipherText.length + OH_LEN);
	var len = outpacket.length - MAC_LEN;

	outpacket.writeUInt32BE(seq, 0);
	cipherText.copy(outpacket, SEQ_LEN);

	// create hamc and sign
	var payloadToSign = outpacket.slice(0, len);
	var hmacSha = crypto.createHmac('sha256', toBuffer(_cipher.macKey));
	hmacSha.update(payloadToSign);
	var mac = hmacSha.digest();
	mac.copy(outpacket, len);

	return outpacket;

};

// get session ID and seq# from the top of  the encrypted packet
CryptoEngine.prototype.getSessionIdAndPayload = function __ceGetSessIdAndPayload(payload) {
	if (payload.length < MIN_PACKET_LEN) {
		return new Error('InvalidPacket');
	}

	var sessionId = uuid.create(payload.slice(0, TOKEN_LEN)).toString();
	var seq = payload.readUInt32BE(TOKEN_LEN, TS_LEN);

	return {
		sessionId: sessionId,
		seq: seq,
		payload: payload.slice(TS_LEN)
	};
};

// payload here is the packet WITHOUT token
// payload is the returned payload from .getSessionIdAndPayload
CryptoEngine.prototype.decrypt = function __ceDecrypt(cipherKeyIn, cipherNonceIn, macKeyIn, seq, payload) {
	var cipherKey = toBuffer(cipherKeyIn);
	var cipherNonce = toBuffer(cipherNonceIn);
	var macKey = toBuffer(macKeyIn);
	var len = payload.length - MAC_LEN;
	var payloadToSign = payload.slice(0, len);
	var cipherText = payload.slice(SEQ_LEN, len);
	var clientHmac = payload.slice(len);

	// calculate signature
	var hmacSha = crypto.createHmac('sha256', macKey);
	hmacSha.update(payloadToSign);
	var mac = hmacSha.digest();
	// compare the signature to the client sent signature
	if (!mac.equals(clientHmac)) {
		return new Error('BadSignature');
	}
	return cbc(
		crypto.createDecipheriv('aes-256-cbc', cipherKey, cipherNonce),
		cipherText
	);
};

/*
* cipherKey: String to create cipher object
* cipherNonce: Buffer length of 8 bytes. random 64-bit nonce (shared secret)
* macKey: Buffer or String. random key of signing (shared secret)
* useq: unique sequence # for this packet
* payload: Buffer or String
*/
CryptoEngine.prototype.encrypt = function __ceEncrypt(cipherKeyIn, cipherNonceIn, macKeyIn, useq, payload) {
	var cipherKey = toBuffer(cipherKeyIn);
	var cipherNonce = toBuffer(cipherNonceIn);
	var macKey = toBuffer(macKeyIn);
	var cipherText = cbc(
		crypto.createCipheriv(AES_CBC, cipherKey, cipherNonce),
		payload
	);
	// OH_LEN = SEQ_LEN + MAC_LEN
	var outpacket = _Buffer.alloc(cipherText.length + OH_LEN);
	var len = outpacket.length - MAC_LEN;
	
	outpacket.writeUInt32BE(useq, 0);
	cipherText.copy(outpacket, SEQ_LEN);

	var payloadToSign = outpacket.slice(0, len);
	var hmacSha = crypto.createHmac('sha256', macKey);
	hmacSha.update(payloadToSign);
	
	var mac = hmacSha.digest();
	
	mac.copy(outpacket, len);

	return outpacket;
};

function cbc(cipher, data) {
	cipher.setEncoding('binary');
		return Buffer.concat([
		cipher.update(data),
		cipher.final()
	]);
}

// converts node.js serialized buffer or base64 string to buffer
function toBuffer(value) {
	if (value && value.type === 'Buffer') {
		return _Buffer.alloc(value.data);
	}
	if (typeof value === 'string') {
		// node.js version 6.0+ _Buffer.alloc() has been deprecated:
		// https://nodejs.org/dist/latest-v6.x/docs/api/buffer.html#buffer_new_buffer_str_encoding
		if (Buffer.from) {
			return Buffer.from(value, 'base64');
		}
		return _Buffer.alloc(value, 'base64');
	}
	return value;
}

module.exports = CryptoEngine;

'use strict';

var crypto = require('crypto');
var uuid = require('../uuid');

// reusable empty buffer for creating cipher
var EMPTY_BUFF = new Buffer(0);
// size of a block for CTR-mo1de
var BLOCK_LEN = 16;
// uuid v4 in raw 128bits binary
var TOKEN_LEN = 16;
// uint32
var SEQ_LEN = 4;
// SHA-256
var MAC_LEN = 32;
// assumes zero layload
var MIN_PACKET_LEN = TOKEN_LEN + SEQ_LEN + MAC_LEN;

function CryptoEngine() {

}

// static constants
CryptoEngine.CIPHER_KEY_LEN = 16;
CryptoEngine.CIPHER_NOUNCE_LEN = 8;
CryptoEngine.MAC_KEY_LEN = MAC_LEN;

// static function
CryptoEngine.createCipher = function __ceCreateCipher() {
	return {
		cipherKey: crypto.randomBytes(16),
		cipherNonce: crypto.randomBytes(8),
		macKey: crypto.randomBytes(32),
		seq: 0
	};
};

// get session ID and seq# from the top of  the encrypted packet
CryptoEngine.prototype.getSessionIdAndPayload = function __ceGetSessIdAndPayload(payload) {
	if (payload.length < MIN_PACKET_LEN) {
		throw new Error('InvalidPacket');
	}

	var len = TOKEN_LEN + SEQ_LEN;
	var token = payload.slice(0, TOKEN_LEN);
	var sessionId = uuid.create(token).toString();
	var seq = payload.readUInt32BE(TOKEN_LEN, len);

	return {
		sessionId: sessionId,
		seq: seq,
		payload: payload.slice(len)
	};
};

// payload here is the packet WITHOUT token
// payload is the returned payload from .getSessionIdAndPayload
CryptoEngine.prototype.decrypt = function __ceDecrypt(cipherKeyIn, cipherNonceIn, macKeyIn, seq, payload) {
	var cipherKey = toBuffer(cipherKeyIn);
	var cipherNonce = toBuffer(cipherNonceIn);
	var macKey = toBuffer(macKeyIn);
	var cipher = createCipher(cipherKey);
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
		return Error('BadSignature');
	}

	// decrypt
	return ctr(cipher, cipherNonce, seq, cipherText);
};

/*
* cipherKey: String to create cipher object
* cipherNonce: Buffer length of 8. random 64-bit nonce (shared secret)
* macKey: Buffer or String. random key of signing (shared secret)
* useq: unique sequence # for this packet
* payload: Buffer or String
*/
CryptoEngine.prototype.encrypt = function __ceEncrypt(cipherKeyIn, cipherNonceIn, macKeyIn, useq, payload) {
	var cipherKey = toBuffer(cipherKeyIn);
	var cipherNonce = toBuffer(cipherNonceIn);
	var macKey = toBuffer(macKeyIn);
	var cipher = createCipher(cipherKey);
	var cipherText = ctr(cipher, cipherNonce, useq, payload);
	var outpacket = new Buffer(cipherText.length + SEQ_LEN + MAC_LEN);
	
	outpacket.writeUInt32BE(useq, 0);
	cipherText.copy(outpacket, SEQ_LEN);

	var payloadToSign = outpacket.slice(0, outpacket.length - MAC_LEN);
	var hmacSha = crypto.createHmac('sha256', macKey);
	
	hmacSha.update(payloadToSign);
	
	var mac = hmacSha.digest();
	
	mac.copy(outpacket, outpacket.length - MAC_LEN);

	return outpacket;
};

// https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation
function createCipher(cipherKey) {
	return crypto.createCipheriv('aes-128-ecb', cipherKey, EMPTY_BUFF);
}

// input MUST be a buffer
// CTR-mode encryption/decryption
// https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_.28CTR.29
function ctr(cipher, cipherNonce, seq, input) {
	var len = 0;
	var clen = 0;
	var totalBlocks = input.length / BLOCK_LEN;
	var output = new Buffer(input.length);
	var counter = new Buffer(BLOCK_LEN);
	// first 8 bytes only
	cipherNonce.copy(counter);
	// 8 = cipherNonce.length
	counter.writeUInt32BE(seq, 8);
	// xor every 16 bytes
	for (var blockNum = 0; blockNum < totalBlocks; blockNum++) {
		// get start and end offset
		var start = blockNum * BLOCK_LEN;
		var end = start + BLOCK_LEN;
		// update the counter
		// 12 = cipherNonce.length + 4 bytes: 4 bytes = size of blockNum as uint32
		counter.writeUInt32BE(blockNum, 12);
		// count the cipher
		var counterCrypt = cipher.update(counter);
		// xor
		var chunk = input.slice(start, end);
		clen = chunk.length;
		// length of counterCrypt is always BLOCK_LEN
		len = clen >= BLOCK_LEN ? BLOCK_LEN : clen;
		for (var i = 0; i < len; i++) {
			output[start + i] = chunk[i] ^ counterCrypt[i];
		}
	}
	return output;
}

// converts node.js serialized buffer or base64 string to buffer
function toBuffer(value) {
	if (value && value.type === 'Buffer') {
		return new Buffer(value.data);
	}
	if (typeof value === 'string') {
		// node.js version 6.0+ new Buffer() has been deprecated:
		// https://nodejs.org/dist/latest-v6.x/docs/api/buffer.html#buffer_new_buffer_str_encoding
		if (Buffer.from) {
			return Buffer.from(value, 'base64');
		}
		return new Buffer(value, 'base64');
	}
	return value;
}

module.exports = CryptoEngine;

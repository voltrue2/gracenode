'use strict';

var crypto = require('crypto');
var uuid = require('../uuid');

// reusable empty buffer for creating cipher
const EMPTY_BUFF_AS_IV = new Buffer(0);

const AES_ECB = 'aes-128-ecb';
// size of a block for CTR-mo1de
const BLOCK_LEN = 16;
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

// static function
CryptoEngine.createCipher = function __ceCreateCipher() {
	return {
		cipherKey: crypto.randomBytes(16),
		cipherNonce: crypto.randomBytes(8),
		macKey: crypto.randomBytes(32),
		seq: 0
	};
};

// static version of getSessionIdAndPayload
CryptoEngine.getSessionIdAndPayload = function __staticGetSessionIdAndPayload(payload) {
	if (payload.length < MIN_PACKET_LEN) {
		throw new Error('InvalidPacket');
	}

	const sessionId = uuid.create(payload.slice(0, TOKEN_LEN)).toString();
	var seq = payload.readUInt32BE(TOKEN_LEN, TS_LEN);

	return {
		sessionId: sessionId,
		seq: seq,
		payload: payload.slice(TS_LEN)
	};
};

// static version of decrypt
CryptoEngine.decrypt = function __staticDecrypt(sid, _cipher, seq, payload) {
	const key = toBuffer(_cipher.cipherKey);
	const len = payload.length - MAC_LEN;
	const payloadToSign = payload.slice(0, len);
	const cipherText = payload.slice(SEQ_LEN, len);
	const clientHmac = payload.slice(len);

	// calculate signature and compare
	var hmacSha = crypto.createHmac('sha256', toBuffer(_cipher.macKey));
	hmacSha.update(payloadToSign);
	const mac = hmacSha.digest();
	if (!mac.equals(clientHmac)) {
		throw new Error('BadSignature');
	}
	return ctr(
		// cipher key
		crypto.createCipheriv(AES_ECB, key, EMPTY_BUFF_AS_IV),
		// cipher nonce
		toBuffer(_cipher.cipherNonce),
		seq,
		cipherText
	);
};

// static version of encrypt
CryptoEngine.encrypt = function __staticEncrypt(sid, _cipher, seq, payload) {
	const key = toBuffer(_cipher.cipherKey);
	const cipherText = ctr(
		// cipher key
		crypto.createCipheriv(AES_ECB, key, EMPTY_BUFF_AS_IV),
		// cipher nonce
		toBuffer(_cipher.cipherNonce),
		seq,
		payload
	);
	// OH_LEN = SEQ_LEN + MAC_LEN
	var outpacket = new Buffer(cipherText.length + OH_LEN);
	const len = outpacket.length - MAC_LEN;

	outpacket.writeUInt32BE(seq, 0);
	cipherText.copy(outpacket, SEQ_LEN);

	// create hamc and sign
	const payloadToSign = outpacket.slice(0, len);
	var hmacSha = crypto.createHmac('sha256', toBuffer(_cipher.macKey));
	hmacSha.update(payloadToSign);
	const mac = hmacSha.digest();
	mac.copy(outpacket, len);

	return outpacket;

};

// get session ID and seq# from the top of  the encrypted packet
CryptoEngine.prototype.getSessionIdAndPayload = function __ceGetSessIdAndPayload(payload) {
	if (payload.length < MIN_PACKET_LEN) {
		throw new Error('InvalidPacket');
	}

	const sessionId = uuid.create(payload.slice(0, TOKEN_LEN)).toString();
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
	const cipherKey = toBuffer(cipherKeyIn);
	const cipherNonce = toBuffer(cipherNonceIn);
	const macKey = toBuffer(macKeyIn);
	var cipher = crypto.createCipheriv(AES_ECB, cipherKey, EMPTY_BUFF_AS_IV);
	const len = payload.length - MAC_LEN;
	const payloadToSign = payload.slice(0, len);
	const cipherText = payload.slice(SEQ_LEN, len);
	const clientHmac = payload.slice(len);

	// calculate signature
	var hmacSha = crypto.createHmac('sha256', macKey);
	hmacSha.update(payloadToSign);
	const mac = hmacSha.digest();
	// compare the signature to the client sent signature
	if (!mac.equals(clientHmac)) {
		throw new Error('BadSignature');
	}

	// decrypt
	return ctr(cipher, cipherNonce, seq, cipherText);
};

/*
* cipherKey: String to create cipher object
* cipherNonce: Buffer length of 8 bytes. random 64-bit nonce (shared secret)
* macKey: Buffer or String. random key of signing (shared secret)
* useq: unique sequence # for this packet
* payload: Buffer or String
*/
CryptoEngine.prototype.encrypt = function __ceEncrypt(cipherKeyIn, cipherNonceIn, macKeyIn, useq, payload) {
	const cipherKey = toBuffer(cipherKeyIn);
	const cipherNonce = toBuffer(cipherNonceIn);
	const macKey = toBuffer(macKeyIn);
	var cipher = crypto.createCipheriv(AES_ECB, cipherKey, EMPTY_BUFF_AS_IV);
	const cipherText = ctr(cipher, cipherNonce, useq, payload);
	// OH_LEN = SEQ_LEN + MAC_LEN
	var outpacket = new Buffer(cipherText.length + OH_LEN);
	const len = outpacket.length - MAC_LEN;
	
	outpacket.writeUInt32BE(useq, 0);
	cipherText.copy(outpacket, SEQ_LEN);

	const payloadToSign = outpacket.slice(0, len);
	var hmacSha = crypto.createHmac('sha256', macKey);
	hmacSha.update(payloadToSign);
	
	const mac = hmacSha.digest();
	
	mac.copy(outpacket, len);

	return outpacket;
};

// input MUST be a buffer
// CTR-mode encryption/decryption
// https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_.28CTR.29
function ctr(cipher, cipherNonce, seq, input) {
	const totalBlocks = input.length / BLOCK_LEN;
	var output = new Buffer(input.length);
	var counter = new Buffer(BLOCK_LEN);
	// first 8 bytes only
	cipherNonce.copy(counter);
	// 8 = cipherNonce.length
	counter.writeUInt32BE(seq, 8);
	// xor every 16 bytes
	for (var blockNum = 0; blockNum < totalBlocks; blockNum++) {
		// get start and end offset
		const start = blockNum * BLOCK_LEN;
		const end = start + BLOCK_LEN;
		// update the counter
		// 12 = cipherNonce.length + 4 bytes: 4 bytes = size of seq
		counter.writeUInt32BE(blockNum, 12);
		// count the cipher
		const counterCrypt = cipher.update(counter);
		const chunk = input.slice(start, end);
		// chunk.length will never be bigger than BLOCK_LEN
		for (var i = 0, len = chunk.length; i < len; i++) {
			// xor
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

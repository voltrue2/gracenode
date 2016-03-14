'use strict';

var crypto = require('crypto');
var xor = require('bitwise-xor');

var uuid = require('../uuid');

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

// get session ID and seq# from the top of  the encrypted packet
CryptoEngine.prototype.getSessionIdAndPayload = function (payload) {
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
// payload is the returned payload from .getSessionIdAndPlayload
CryptoEngine.prototype.decrypt = function (cipherKey, cipherNonce, macKey, seq, payload) {
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
		throw new Error('BadSignature');
	}

	// decrypt
	return ctr(cipher, cipherNonce, seq, cipherText);
};

/*
* cipherKey: String to create cipher object
* cipherNonce: Buffer length of 8. random 64-bit nonce (shared secret)
* macKey: Buffer or String. random key of signing (shared secret)
* useq: unique sequence # for this packet
* payload: Buffer or String.
*/
CryptoEngine.prototype.encrypt = function (cipherKey, cipherNonce, macKey, useq, payload) {
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

// private
// TODO: memory leak warning...
/*
CryptoEngine.prototype._checkSeen = function (sessionId, seq) {
	var sessList = this.seen.sessionIds;
	var seqList =  this.sesn.seqs;
	if (sessList.indexOf(sessionId) !== -1 && seqList.indexOf(seq) !== -1) {
		throw new Error('DuplicateSessionIdAndSeq');
	}
	this.seen.sessionIds.push(sessionId);
	this.seen.seqs.push(seq);
};
*/

// FIXME: also aes-128-ecb is weak consider cbc
function createCipher(cipherKey) {
	return crypto.createCipheriv('aes-128-ecb', cipherKey, new Buffer(0));
}

// DTR-mode encryption/decryption
// https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_.28CTR.29
function ctr(cipher, cipherNonce, seq, input) {
	var totalBlocks = input.length / 16;
	var output = new Buffer(input.length);
	var counter = new Buffer(16);
	// first 8 bytes only
	cipherNonce.copy(counter);
	counter.writeUInt32BE(seq, 8);

	for (var blockNum = 0; blockNum < totalBlocks; blockNum++) {
		var start = blockNum * 16;
		var end = start + 16;
		
		counter.writeUInt32BE(blockNum, 12);
		
		var counterCrypt = cipher.update(counter);
		var oneBlock = xor(input.slice(start, end), counterCrypt);
		
		oneBlock.copy(output, start); 
	}

	return output;
}

module.exports = CryptoEngine;
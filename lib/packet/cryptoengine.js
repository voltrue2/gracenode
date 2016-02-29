'use strict';

var crypto = require('crypto');
var assert = require('assert');
var xor = require('bitwise-xor');

var uuid = require('./uuid');

// uuid v4 in raw 128bits binary
var TOKEN_LEN = 16;
// uint32
var SEQ_LEN = 4;
// SHA-256
var MAC_LEN = 32;
// assumes zero layload
var MIN_PACKET_LEN = TOKEN_LEN + SEQ_LEN + MAC_LEN;

function CryptoEngine() {
	this.seen = {
		sessionIds: [],
		seqs: []
	};
}

// get session ID and seq# from the top of  the encrypted packet
CryptoEngine.prototype.getSessionId = function (payload) {
	if (payload.length < MIN_PACKET_LEN) {
		throw new Error('InvalidPacket');
	}

	var token = payload.slice(0, TOKEN_LEN);
	var sessionId = uuid.uuid(token);
	var seq = payload.readUInt32BE(TOKEN_LEN, TOKEN_LEN + SEQ_LEN);
	
	// check to see if we have seen sessionId and seq already
	this.checkSeen(sessionId, seq);

	return {
		sessionId: sessionId,
		seq: seq
	};
};

CryptoEngine.prototype.decrypt = function (cipher, cipherNonce, macKey, seq, payload) {

	assert(cipher instanceof crypto.Cipheriv, 'CipherMustBeCipherivObject');

	var payloadToSign = payload.slice(0, payload.length - MAC_LEN);
	var cipherText = payload.slice(TOKEN_LEN + SEQ_LEN, payload.length - MAC_LEN);
	var clientHmac = payload.slice(payload.length - MAC_LEN);

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
* cipher: Cipheriv object. aes-128-ecb cipher
* cipherNonce: Buffer length of 8. random 64-bit nonce (shared secret)
* macKey: Buffer or String. random key of signing (shared secret)
* useq: unique sequence # for this packet
* payload: Buffer or String.
*/
CryptoEngine.prototype.encrypt = function (cipher, cipherNonce, macKey, useq, payload) {

	assert(cipher instanceof crypto.Cipheriv, 'CipherMustBeCipherivObject');

	var cipherText = ctr(cipher, cipherNonce, useq, payload);
	var outpacket = new Buffer(cipherText.length + 4 + MAC_LEN);
	
	outpacket.writeUInt32BE(useq);
	cipherText.copy(outpacket, 4);

	var payloadToSign = outpacket.slice(0, outpacket.length - MAC_LEN);
	var hmacSha = crypto.createHmac('sha256', macKey);
	
	hmacSha.update(payloadToSign);
	
	var mac = hmacSha.digest();
	
	mac.copy(outpacket, outpacket.length - MAC_LEN);

	return outpacket;
};

// private
// TODO: memory leak warning...
CryptoEngine.prototype._checkSeen = function (sessionId, seq) {
	var sessList = this.seen.sessionIds;
	var seqList =  this.sesn.seqs;
	if (sessList.indexOf(sessionId) !== -1 && seqList.indexOf(seq) !== -1) {
		throw new Error('DuplicateSessionIdAndSeq');
	}
	this.seen.sessionIds.push(sessionId);
	this.seen.seqs.push(seq);
};

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

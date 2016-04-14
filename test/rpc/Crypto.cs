using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

public class Crypto {
	
	private const int BLOCK_LEN = 16;

	private byte[] _sessionId;
	private byte[] _sharedSecret;
	private byte[] _cipherKey;
	private byte[] _cipherNonce;
	private byte[] _cipherCounter;
	private byte[] _macKey;
	private uint _sequence;
	private ICryptoTransform _cryptoAlgorithm;
	private HMACSHA256 _hashAlgorithm;
	private int _hashLength;	

	public Crypto(Guid sessionId, byte[] cipherKey, byte[] cipherNonce, byte[] macKey) {
		if (cipherKey.Length != 16) {
			throw new System.ArgumentException("Chipher Key must be 16 bytes");
		}

		if (cipherNonce.Length != 8) {
			throw new System.ArgumentException("Chipher Nonce must be 8 bytes");
		}

		if (macKey.Length != 32) {
			throw new System.ArgumentException("Mac Key must be 32 bytes");
		}

		_sequence = 0;
		_sessionId = TransposeGuidBytes(sessionId.ToByteArray());
		_cipherKey = cipherKey;
		_cipherNonce = cipherNonce;
		_cipherCounter = new byte[_cipherNonce.Length + sizeof(uint) + sizeof(uint)];
		_macKey = macKey;

		if (_sessionId.Length != 16) {
			throw new System.ArgumentException("Session ID must be 16 bytes");
		}


		if (_cipherCounter.Length != 16) {
			throw new System.ArgumentException("Chipher Counter must be 16 bytes");
		}

		// aes-128-ecb
		Aes aes = Aes.Create();
		aes.Mode = CipherMode.ECB;
		aes.Key = _cipherKey;
		_cryptoAlgorithm = aes.CreateEncryptor();

		_hashAlgorithm = new HMACSHA256(_macKey);
		_hashLength = _hashAlgorithm.HashSize / 8;
		_sharedSecret = new byte[_cipherKey.Length + _cipherNonce.Length + _macKey.Length];

		if (_hashLength != 32) {
			throw new System.ArgumentException("Hash must be 32 bytes");
		}

		if (_sharedSecret.Length != 56) {
			throw new System.ArgumentException("Shared Secret must be 56 bytes");
		}

		// copy _chipherKey to _sharedSecret
		Buffer.BlockCopy(_cipherKey, 0, _sharedSecret, 0, _cipherKey.Length);
		// copy _cipherNonce to _sharedSecret
		Buffer.BlockCopy(_cipherNonce, 0, _sharedSecret, _cipherKey.Length, cipherNonce.Length);
		// copy _macKey to _sharedSecret
		Buffer.BlockCopy(_macKey, 0, _sharedSecret, _cipherKey.Length + _cipherNonce.Length, _macKey.Length);
		// copy _cipherNonce to _cihperCounter
		Buffer.BlockCopy(_cipherNonce, 0, _cipherCounter, 0, _cipherNonce.Length);
	}

	public byte[] Encrypt(byte[] payload) {
		_sequence++;
		byte[] seqBytes = BitConverter.GetBytes(IPAddress.NetworkToHostOrder((int)_sequence));
		byte[] cipherBytes = new byte[payload.Length];
		byte[] outpacket = new byte[cipherBytes.Length + seqBytes.Length + _hashLength];

		Ctr(_sequence, payload, cipherBytes, 0);

		Buffer.BlockCopy(seqBytes, 0, outpacket, 0, seqBytes.Length);
		Buffer.BlockCopy(cipherBytes, 0, outpacket, seqBytes.Length, cipherBytes.Length);

		byte[] payloadToSign = ByteSlice(outpacket, 0, outpacket.Length - _hashLength);
		byte[] hmac = _hashAlgorithm.ComputeHash(payloadToSign);

		Buffer.BlockCopy(hmac, 0, outpacket, outpacket.Length - _hashLength, _hashLength);

		byte[] epacket = new byte[_sessionId.Length + seqBytes.Length + outpacket.Length];

		Buffer.BlockCopy(_sessionId, 0, epacket, 0, _sessionId.Length);
		Buffer.BlockCopy(seqBytes, 0, epacket, _sessionId.Length, seqBytes.Length);
		Buffer.BlockCopy(outpacket, 0, epacket, _sessionId.Length + seqBytes.Length, outpacket.Length);

		return epacket;
	}

	// TODO: untested
	public byte[] Decrypt(byte[] payload) {
		int seqSize = sizeof(uint);
		uint seq = (uint)IPAddress.HostToNetworkOrder(BitConverter.ToUInt32(payload, 0));
		byte[] payloadToSign = ByteSlice(payload, 0, payload.Length + _hashLength);
		byte[] serverHmac = ByteSlice(payload, payload.Length - _hashLength, _hashLength);
		byte[] clientHmac = _hashAlgorithm.ComputeHash(payloadToSign);

		if (ByteEqual(serverHmac, clientHmac)) {
			byte[] eBytes = ByteSlice(payload, seqSize, payload.Length - serverHmac.Length);
			byte[] dBytes = new byte[eBytes.Length];

			Ctr(seq, eBytes, dBytes, 0);

			return dBytes;
		}

		return null;
	}

	private static byte[] TransposeGuidBytes(byte[] buffIn) {
		byte[] buffOut = new byte[buffIn.Length];
		buffOut[3] = buffIn[0];
		buffOut[2] = buffIn[1];
		buffOut[1] = buffIn[2];
		buffOut[0] = buffIn[3];
		buffOut[5] = buffIn[4];
		buffOut[4] = buffIn[5];
		buffOut[7] = buffIn[6];
		buffOut[6] = buffIn[7];
		buffOut[8] = buffIn[8];
		buffOut[9] = buffIn[9];
		buffOut[10] = buffIn[10];
		buffOut[11] = buffIn[11];
		buffOut[12] = buffIn[12];
		buffOut[13] = buffIn[13];
		buffOut[14] = buffIn[14];
		buffOut[15] = buffIn[15];
		return buffOut;
	}

	private void Ctr(uint seq, byte[] inBytes, byte[] outBytes, int offset) {
		int count = (inBytes.Length + 15) / 16;
		byte[] ctrBytes = new byte[count * 16];
		byte[] seqBytes = BitConverter.GetBytes(IPAddress.HostToNetworkOrder((int)seq));
		Buffer.BlockCopy(seqBytes, 0, _cipherCounter, _cipherNonce.Length, seqBytes.Length);
		for(int b = 0; b < count; b++) {
			byte[] blkBytes = BitConverter.GetBytes(IPAddress.HostToNetworkOrder(b));
			Buffer.BlockCopy(blkBytes, 0, _cipherCounter, _cipherNonce.Length + blkBytes.Length, blkBytes.Length);
			_cryptoAlgorithm.TransformBlock(_cipherCounter, 0, 16, ctrBytes, b * 16);
		}
		for(int i = 0; i < inBytes.Length; i++) {
			outBytes[offset + i] = (byte)(ctrBytes[i] ^ inBytes[i]);
		}
	}

	private byte[] ByteSlice(byte[] source, int start, int end) {
		byte[] res = new byte[end - start];

		// handles negative end
		if (end < 0) {
			end = source.Length + end;
		}

		int len = end - start;

		for (int i = 0; i < len; i++) {
			res[i] = source[i + start];
		}

		return res;
	}

	private bool ByteEqual(byte[] a, byte[] b) {

		if (a.Length != b.Length) {
			return false;
		}

		int i = 0;
		int alen = a.Length;
		while (i < alen && (a[i] == b[i])) {
			i++;
		}

		if (i == alen) {
			return true;
		}

		return false;
	}

}

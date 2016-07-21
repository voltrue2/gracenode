using System;
using System.Text;
using System.Net;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;

namespace PacketProtocol {
	
	public class Packet {
		
		public const int VER0 = 0x0;
		
		public const int OFFSET_VER = 0;
		public const int OFFSET_PLEN = 0;
		public const int OFFSET_CMD = 4;
		public const int OFFSET_RFLAG = 4;
		public const int OFFSET_STATUS = 5;
		public const int OFFSET_SEQ = 6;
		public const int OFFSET_PAYLOAD = 8;
		
		public const int HEADER_SIZE = 8;
		public const int STOP_SIZE = 4;

		public const int UINT8_SIZE = 1;		
		public const int UINT16_SIZE = 2;
		public const int UINT32_SIZE = 4;

		public const int MSTOP = 0x5c724c6e;

		// TODO: protocol version 0 only
		public static byte[] Create(short commandId, short sequence, byte[] payload) {
			// calculate payload size
			int payloadSize = IPAddress.HostToNetworkOrder(payload.Length);
			// calculate packet size
			int packetSize = Packet.HEADER_SIZE + Packet.STOP_SIZE + payload.Length;
			// create packet
			byte[] packet = new byte[packetSize];
			// set protocol version to packet
			packet[Packet.OFFSET_VER] = Packet.VER0;
			// add payload size
			Buffer.BlockCopy(
				BitConverter.GetBytes(payloadSize),
				0,
				packet,
				Packet.OFFSET_PLEN,
				Packet.UINT32_SIZE
			);
			// add command ID
			byte[] cmd = BitConverter.GetBytes(
				IPAddress.HostToNetworkOrder(commandId)
			);
			Buffer.BlockCopy(
				cmd,
				0,
				packet,
				Packet.OFFSET_CMD,
				Packet.UINT16_SIZE
			);
			// add seq
			byte[] seq = BitConverter.GetBytes(
				IPAddress.HostToNetworkOrder(sequence)
			);
			Buffer.BlockCopy(
				seq,
				0,
				packet,
				Packet.OFFSET_SEQ,
				Packet.UINT16_SIZE
			);
			// add payload
			Buffer.BlockCopy(
				payload,
				0,
				packet,
				Packet.OFFSET_PAYLOAD,
				payload.Length
			);
			// add stop symbol
			byte[] stop = BitConverter.GetBytes(
				IPAddress.HostToNetworkOrder(
					Convert.ToInt32(Packet.MSTOP)
				)
			);
			Buffer.BlockCopy(
				stop,
				0,
				packet,
				payload.Length + Packet.HEADER_SIZE,
				Packet.UINT32_SIZE
			);
			return packet;
		}

		public static ParsedPacketData Parse(byte[] packet) {
			ParsedPacketData parsed = new ParsedPacketData();
			// read protocol version
			byte[] ver = new byte[Packet.UINT32_SIZE];
			Buffer.BlockCopy(
				packet,
				Packet.OFFSET_VER,
				ver,
				0,
				Packet.UINT8_SIZE
			);
			uint version = BitConverter.ToUInt32(ver, 0);
			parsed.Version = version;
			if (version != VER0) {
				// invalid packet
				parsed.Invalid = true;
				return parsed;
			}
			// read payload size
			byte[] plen = new byte[Packet.UINT32_SIZE];
			Buffer.BlockCopy(
				packet,
				Packet.OFFSET_PLEN,
				plen,
				0,
				Packet.UINT32_SIZE
			);
			// array reverse for big endian conversion
			Array.Reverse(plen);
			uint payloadSize = BitConverter.ToUInt32(plen, 0);
			parsed.PayloadSize = payloadSize;
			if (payloadSize > packet.Length) {
				parsed.Invalid = true;
				return parsed;
			}
			// read reply flag
			byte[] rflag = new byte[Packet.UINT32_SIZE];
			Buffer.BlockCopy(
				packet,
				Packet.OFFSET_RFLAG,
				rflag,
				0,
				Packet.UINT8_SIZE
			);
			uint replyFlag = BitConverter.ToUInt32(rflag, 0);
			bool isReply = false;
			if (replyFlag == 0x01) {
				isReply = true;
			}
			parsed.IsReply = isReply;
			// read status
			byte[] stat = new byte[Packet.UINT32_SIZE];
			Buffer.BlockCopy(
				packet,
				Packet.OFFSET_STATUS,
				stat,
				0,
				Packet.UINT8_SIZE
			);
			uint status = BitConverter.ToUInt32(stat, 0);
			parsed.Status = status;
			// read sequence
			byte[] sequence = new byte[Packet.UINT16_SIZE];
			Buffer.BlockCopy(
				packet,
				Packet.OFFSET_SEQ,
				sequence,
				0,
				Packet.UINT16_SIZE
			);
			// array reverse for big endian conversion
			Array.Reverse(sequence);
			uint seq = BitConverter.ToUInt16(sequence, 0);
			parsed.Seq = seq;
			// read payload
			byte[] payload = new byte[payloadSize];
			Buffer.BlockCopy(
				packet,
				Packet.OFFSET_PAYLOAD,
				payload,
				0,
				(int)payloadSize
			);
			parsed.Payload = payload;
			// read stop
			byte[] mstop = new byte[Packet.UINT32_SIZE];
			Buffer.BlockCopy(
				packet,
				Packet.HEADER_SIZE + (int)Convert.ToUInt32(payloadSize),
				mstop,
				0,
				Packet.UINT32_SIZE
			);
			// array reverse for big endian conversion
			Array.Reverse(mstop);
			uint stop = BitConverter.ToUInt32(mstop, 0);
			if (stop != Packet.MSTOP) {
				parsed.Invalid = true;
				return parsed;
			}
			// done
			return parsed;
		}	

	}

	public class ParsedPacketData {
		public bool Invalid = false;
		public uint Version { get; set; }
		public uint PayloadSize { get; set; }
		public bool IsReply { get; set; }
		public uint Status { get; set; }
		public uint Seq { get; set; }
		public byte[] Payload { get; set; }
	}

	public class Status {

		public const int OK = 1;
		public const int BAD_REQ = 2;
		public const int FORBIDDEN = 3;
		public const int NOT_FOUND = 4;
		public const int SERVER_ERR = 5;
		public const int UNAVAILABLE = 6;
		public const int UNKNOWN = 99;
		
	}

}

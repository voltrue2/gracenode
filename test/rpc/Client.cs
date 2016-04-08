using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

class Tcp {
	
	public static void Main(string[] args) {
		string serverHost = "49.212.31.139";
		int serverPort = 9876;
		int payloadSize;
		int uint16Size = 2;
		int uint32Size = 4;
		int packetSize;
		uint cmdId = 1;
		uint seq = 100;
		uint stopSymbol = 1550998638;
		byte[] msg;
		byte[] packet;

		/*
		Console.WriteLine("Enter server host name:");

		serverHost = Console.ReadLine();

		Console.WriteLine("Enter server port number:");

		serverPort = int.Parse(Console.ReadLine());
		*/

		TcpClient client = new TcpClient(serverHost, serverPort);
		NetworkStream stream = client.GetStream();
		
		msg = Encoding.UTF8.GetBytes("{ \"message\":\"Hello\"}");

		// create gracenode RPC command packet
		payloadSize = IPAddress.HostToNetworkOrder(msg.Length);
		byte[] payloadSizeBytes = BitConverter.GetBytes(payloadSize);
		packetSize = uint32Size + (uint16Size * 2) + msg.Length + uint32Size;
		packet = new byte[packetSize];
	
		Console.WriteLine("payload size is {0}", msg.Length);
		Console.WriteLine("packet size is {0}", packetSize);	
		
		// RPC protocol version 0
		packet[0] = 0x0;

		// add payload size at the offset of 0: payload size if utin32 4 bytes
		Buffer.BlockCopy(payloadSizeBytes, 0, packet, 0, uint32Size);

		// add command ID at the offset of 4: command ID is uint16 2 bytes
		byte[] cmd = BitConverter.GetBytes(IPAddress.HostToNetworkOrder((short)cmdId));
		Buffer.BlockCopy(cmd, 0, packet, 4, uint16Size);

		// add seq at the offset of 6: seq is uint16 2 bytes
		byte[] seqBytes = BitConverter.GetBytes(IPAddress.HostToNetworkOrder((short)seq));
		Buffer.BlockCopy(seqBytes, 0, packet, 6, uint16Size);

		// add payload at the offset of 8
		Buffer.BlockCopy(msg, 0, packet, 8, msg.Length);

		// add magic stop symbol: magic stop symbol is uint 32 4 bytes
		int stop = IPAddress.HostToNetworkOrder(Convert.ToInt32(stopSymbol));
		byte[] stopBytes = BitConverter.GetBytes(stop);
		Buffer.BlockCopy(stopBytes, 0, packet, msg.Length + 8, uint32Size);
		
		Console.WriteLine("Sending command packet: {0}", packet.Length);

		// send command packet to server
		stream.Write(packet, 0, packet.Length);

		// receive the response back from server
		// read in chunk of 2KB
		byte[] res = new byte[2048];
		int bytesRead = 0;
		bytesRead = stream.Read(res, 0, res.Length);
		while (bytesRead > 0) {
			// read payload size
			byte[] psizeBytes = new byte[uint32Size];
			Buffer.BlockCopy(res, 0, psizeBytes, 0, uint32Size);
			// big endian
			Array.Reverse(psizeBytes);
			uint psize = BitConverter.ToUInt32(psizeBytes, 0);
			
			Console.WriteLine("Reply payload size is {0}", psize);
			
			// read reply flag
			byte[] flagBytes = new byte[4];
			Buffer.BlockCopy(res, 4, flagBytes, 0, 1);
			int replyFlag = BitConverter.ToInt32(flagBytes, 0);

			Console.WriteLine("Reply flag is {0}", replyFlag);

			// read reply status
			byte[] statusBytes = new byte[4];
			Buffer.BlockCopy(res, 5, statusBytes, 0, 1);
			int status = BitConverter.ToInt32(statusBytes, 0);

			Console.WriteLine("Replay status is {0}", status);

			// read seq
			byte[] rseqBytes = new byte[uint16Size];
			Buffer.BlockCopy(res, 6, rseqBytes, 0, uint16Size);
			// big endian
			Array.Reverse(rseqBytes);
			uint rseq = BitConverter.ToUInt16(rseqBytes, 0);	

			Console.WriteLine("Reply seq is {0}", rseq);

			// read payload
			byte[] payloadBytes = new byte[psize];
			Buffer.BlockCopy(res, 8, payloadBytes, 0, Convert.ToInt32(psize));
			string payload = Encoding.UTF8.GetString(payloadBytes, 0, payloadBytes.Length);

			Console.WriteLine("Reply payload is {0}", payload);

			// read magic stop symbol
			byte[] sbytes = new byte[uint32Size];
			Buffer.BlockCopy(res, 8 + Convert.ToInt32(psize), sbytes, 0, uint32Size);
			// big endian
			Array.Reverse(sbytes);
			uint mstop = BitConverter.ToUInt32(sbytes, 0);

			Console.WriteLine("Magic stop symbol is {0}. must be the same as {1}", mstop, stopSymbol);

			if (mstop == stopSymbol) {
				Console.WriteLine("End of replay packet");
				break;
			}

			bytesRead = stream.Read(res, 0, res.Length);
		}
		
		Console.WriteLine("Done and close connection");

		// close the connection
		//stream.Close();
	}

}

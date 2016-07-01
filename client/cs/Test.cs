using System;
using System.Net;
using System.Net.Sockets;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;

using PacketProtocol;

public class Test {

	public static void Main() {
	
		string addr = "127.0.0.1";
		int port = 7980;
		short cmd = 1;
		short seq = 0;
		string msg = "Hello";
		byte[] payload = Encoding.ASCII.GetBytes(msg);
		byte[] packet = Packet.Create(cmd, seq, payload);		
		
		UdpClient udp = new UdpClient();
		var ip = IPAddress.Parse(addr);
		IPEndPoint ep = new IPEndPoint(ip, port);
		udp.Connect(ep);
		
		// send
		udp.Send(packet, packet.Length);

		// receive
		bool done = false;
		while (!done) {
			if (udp.Available <= 0) {
				IPEndPoint ep2 = new IPEndPoint(0, 0);
				byte[] packet2 = udp.Receive(ref ep2);
				
				Console.WriteLine("packet size: {0}", packet2.Length);

				Dictionary<string, object> parsed = Packet.Parse(packet2);
				foreach (KeyValuePair<string, object> item in parsed) {
					Console.WriteLine("Received:{0} = {1}", item.Key, item.Value);
				}
				done = true;
			}
		}
	}

}

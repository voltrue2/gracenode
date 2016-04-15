using System;
using System.IO;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Text;
using SimpleJSON;

// UDP client
using System.Net;
using System.Net.Sockets;


public class Udp {

	static void Main(string[] args) {
		string serverIp;
		int httpPort;
		int serverPort;
		const string STOP = "stop";

		Console.WriteLine("Enter server IP address:");

		serverIp = Console.ReadLine();

		Console.WriteLine("Enter HTTP port number:");

		httpPort = int.Parse(Console.ReadLine());

		Console.WriteLine("Connection to {0}:{1}", serverIp, httpPort);
		
		var request = (HttpWebRequest)WebRequest.Create("http://" + serverIp + ":" + httpPort + "/auth");
		var postData = "thing1=hello";
		postData += "&thing2=world";
		var data = Encoding.ASCII.GetBytes(postData);
		request.Method = "POST";
		request.ContentType = "application/x-www-form-urlencoded";
		request.ContentLength = data.Length;
		var stream = request.GetRequestStream();
		stream.Write(data, 0, data.Length);
		var response = (HttpWebResponse)request.GetResponse();
		var authRes = new StreamReader(response.GetResponseStream()).ReadToEnd();

		Console.WriteLine("Auth response:{0}", authRes);
		
		JSONNode auth = JSON.Parse(authRes);

		Console.WriteLine("Session ID is {0}", auth["sessionId"]);
		Console.WriteLine(
			"Cipher Key, Nonce, and MacKey:{0}, {1}, {2}",
			auth["cipherData"]["base64"]["cipherKey"],
			auth["cipherData"]["base64"]["cipherNonce"],
			auth["cipherData"]["base64"]["macKey"]
		);

		Console.WriteLine("Enter UDP server port number:");

		serverPort = int.Parse(Console.ReadLine());

		Console.WriteLine("Connection to {0}:{1}", serverIp, serverPort);

		int myPort = 54061;

		// connect to UDP server and send message
		UdpClient client = new UdpClient(myPort);
		IPEndPoint endPoint = new IPEndPoint(IPAddress.Parse(serverIp), serverPort);
		client.Connect(endPoint);

		Console.WriteLine("Prepare encryption");

		// prepare encryption
		Guid sid = new Guid(auth["sessionId"]);
		byte[] cipherKey = System.Convert.FromBase64String(auth["cipherData"]["base64"]["cipherKey"]);
		byte[] cipherNonce = System.Convert.FromBase64String(auth["cipherData"]["base64"]["cipherNonce"]);
		byte[] macKey = System.Convert.FromBase64String(auth["cipherData"]["base64"]["macKey"]);
		var crypto = new Crypto(sid, cipherKey, cipherNonce, macKey);		

		byte[] packet = Encoding.ASCII.GetBytes("{\"command\":1,\"payload\":\"Hello\"}");
		var epacket = crypto.Encrypt(packet);
		
		client.Send(epacket, epacket.Length);
		
		Console.WriteLine("UDP message sent: size is {0}", epacket.Length);

		Console.WriteLine("Waiting for server message...");

		byte[] recData = client.Receive(ref endPoint);

		Console.WriteLine("Try decrypting...");

		var dpack = crypto.Decrypt(recData);

		Console.WriteLine("message from server: {0}", Encoding.UTF8.GetString(dpack));
		
	}

}

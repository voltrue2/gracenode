/*
	C ECHO client example using sockets
*/
#include<stdio.h> //printf
#include<string.h>	//strlen
#include<sys/socket.h>	//socket
#include<arpa/inet.h> //inet_addr

#define PAYLOAD_SIZE 1000;
#define REP_SIZE 2000; 

int main(int argc, char *argv[]) {
	int sock;
	struct sockaddr_in server;
	char message[1000];
	char server_reply[2000];
	char *host;
	int port;
	int seq;
	struct packet {
		int ver;
		uint16_t cmd;
		uint16_t seq;
		char payload[0];
	};
 
	//Create socket
	sock = socket(AF_INET, SOCK_STREAM, 0);
	if (sock == -1)
	{
		printf("Could not create socket");
	}
	puts("Socket created");
	
	host = argv[1];
	port = atoi(argv[2]);
 
	server.sin_addr.s_addr = inet_addr(host);
	server.sin_family = AF_INET;
	server.sin_port = htons(port);
 
	//Connect to remote server
	if (connect(sock, (struct sockaddr *)&server, sizeof(server)) < 0) {
		perror("connect failed. Error");
		return 1;
	}
	 
	puts("Connected\n");
	 
	//keep communicating with server
	while (1) {
		printf("Enter message : ");
		scanf("%s", message);
		 
		// create packet to send

		printf("\nPayload size: %i\n", strlen(message));
		
		struct packet msg;
		// protocol version
		msg.ver = 0;
		// payload size
		uint32_t plength = strlen(message);
		uint32_t plen = htonl(plength);
		memmove(&(msg), &plen, sizeof(plen));
		msg.cmd = htons(1);
		msg.seq = htons(seq);
		memmove(&(msg.payload[0]), message, strlen(message));
		//uint32_t stopval = 1550998638;
		uint32_t stopval = 0x5c725c6e;
		uint32_t stop = htonl(stopval);
		memmove(&(msg.payload[strlen(message)]), &stop, sizeof(stop));

		int packetlen = sizeof(msg) + sizeof(plen) + strlen(message) + sizeof(stop) + 4;

		printf("packet size: %i\n", packetlen);

		//Send some data
		if(send(sock, &msg, packetlen, 0) < 0) {
			puts("Send failed");
			return 1;
		}
		
		seq++;

		//Receive a reply from the server
		if(recv(sock, server_reply, 2000, 0) < 0) {
			puts("recv failed");
			break;
		}
		 
		puts("Server reply :");
		puts(server_reply);
	}
	 
	close(sock);
	return 0;
}

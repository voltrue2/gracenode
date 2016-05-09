# MAC OS
COMPILER="mcs";

if [ -z "$COMPILER" ]; then
	# Linux
	COMPILER="gmcs";
fi

`echo "$COMPILER" -main:Udp -out:udp.exe SimpleJSON.cs Crypto.cs Udp.cs`;

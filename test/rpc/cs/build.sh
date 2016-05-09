# default is the compiler for MAC OS
COMPILER="mcs";

if [ -z "$COMPILER" ]; then
	# Linux
	COMPILER="gmcs";
fi

`echo "$COMPILER" -main:Tcp -out:tcp.exe SimpleJSON.cs Crypto.cs Tcp.cs`;

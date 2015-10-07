#!/bin/bash

path=$1;

echo "Generate SSL certificates for development";

if [ "$path" == "" ]; then
	path="../";
fi

echo "pem files will be created in $path";

`openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout "$path"key.pem -out "$path"cert.pem`;

echo "Done";

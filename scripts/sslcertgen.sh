#!/bin/sh

path=$1;

echo "Generate SSL certificates for production";

echo "pem files will be created in $path";

`openssl req -newkey rsa:2048 -new -nodes -keyout "$path"key.pem -out "$path"csr.pem`;

echo "Done";

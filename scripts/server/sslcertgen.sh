#!/bin/bash

path=$1;

echo "Generate SSL certificates for production";

if [ "$path" == "" ]; then
    path="../";
fi


echo "pem files will be created in $path";

`openssl req -newkey rsa:2048 -new -nodes -keyout "$path"key.pem -out "$path"csr.pem`;

echo "Done";

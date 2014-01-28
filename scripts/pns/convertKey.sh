sourceFile=$1;
outPem=$2;

echo "converting to key pem file...";

`openssl pkcs12 -nocerts -out $outPem -in $sourceFile`;

echo "removing PEM passpharase";

`openssl rsa -in $outPem -out $outPem`;

echo "done";

exit;

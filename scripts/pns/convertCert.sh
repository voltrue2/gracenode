sourceFile=$1;
outPem=$2;

echo "converting to certificate pem file...";

`openssl pkcs12 -clcerts -nokeys -out $outPem -in $sourceFile`;

echo "done";

exit;

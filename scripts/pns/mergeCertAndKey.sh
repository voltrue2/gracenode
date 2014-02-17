outCertPem=$1;
outKeyPem=$2;
outPem=$3;
echo "merging certificate and key";

`cat $outCertPem $outKeyPem &gt; $outPem`;

echo "done";

exit;

#!/bin/sh

NAME="gracenode";
CWD=`pwd`;

# returns an index position of a given string. if there is no match -1 is returned
indexOf() {
	pos=""${1%%$2*};
	[[ $pos = $1 ]] && echo -1 || echo ${#pos};
}

index=`indexOf "$CWD" "$NAME"`;

if [ "$index" -ne -1 ]; then
	path=`expr substr $CWD 1 $index`"$NAME/src/lint/";
else
	path="./src/lint/";
fi

"$path"lint.sh -a index.js src/ lib/

if [ $? -eq 0 ]; then
	echo "OK";
else
	exit 1;
fi

`echo make test`

if [ $? -eq 0 ]; then
	echo "OK";
else
	exit 1;
fi


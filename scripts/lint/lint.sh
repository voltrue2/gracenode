#!/bin/sh

nomatch="-1";
name="GraceNode";
cwd=`pwd`;

indexOf() {
	pos="${1%%$2*}";
	[[ $pos = $1 ]] && echo -1 || echo ${#pos};
}

echoGreen() {
	echo -en '\E[32m'"\033[1m$1\033[0m\n\r";
}

echoYellow() {
	echo -en '\E[33m'"\033[1m$1\033[0m\n\r";
}

echoBlue() {
	echo -en '\E[34m'"\033[1m$1\033[0m\n\r";
}

echoRed() {
	echo -en '\E[31m'"\033[1m$1\033[0m\n\r";
}

# find root path
index=`indexOf "$cwd" "$name"`;
if [ "$index" -ne -1 ]; then
	path=`expr substr $cwd 1 $index`"$name/";
else 
	path="./";
fi 

# start linting
echoYellow "Executing jshint...";

echoBlue "Current working directory: $cwd";

echoBlue "Root path: $path";

#################
# lint index.js
#################
echo "linting "$path"index.js";

failed=`jshint "$path"index.js`;

if [ "$failed" ]; then
	echoRed "*** [error] lint error(s) in core directory";
	echoRed $failed;
	exit 1;
else
	echoGreen "Passed [OK]";
fi

#############
# lint core/
#############
echo "linting "$path"core/";

failed=`jshint "$path"core/`;

if [ "$failed" ]; then
	echoRed "*** [error] lint error(s) in core directory";
	echoRed $failed;
	exit 1;
else
	echoGreen "Passed [OK]";
fi

##################
# lint modules/
##################
echo "liniting "$path"modules/";

failed=`jshint "$path"modules/`;

if [ "$failed" ]; then
	echoRed "*** [ERROR] lint error(s) in core directory";
	echoRed $failed;
	exit 1;
else
	echoGreen "Passed [OK]";
fi

#################
# lint lib/
#################
echo "linting "$path"lib/";

failed=`jshint "$path"lib/`;

if [ "$failed" ]; then
	echoRed "*** [error] lint error(s) in core directory";
	echoRed $failed;
	exit 1;
else
	echoGreen "Passed OK";
fi

echoYellow "Done";

exit 0;

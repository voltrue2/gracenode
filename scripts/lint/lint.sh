#!/bin/sh

nomatch="-1";
name="GraceNode";
cwd=`pwd`;

# optional comma separated list of directories to lint
dirList=$1;

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

lint() {
	targetPath="$path$1";

	if [ -d "$targetPath" ] || [ -f "$targetPath" ]; then

		echo "linting $targetPath";

		failed=`jshint "$targetPath"`;
		if [ "$failed" ]; then
			echoRed "*** [error] lint error(s) in $1";
			echoRed "$failed";
			exit 1;
		else
			echoGreen "Passed [OK]";
		fi
		
	else
		echoRed "*** [error] $targetPath";
		echoRed "No such file or directory ($targetPath)";
		exit 1;		
	fi
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

### lint default directories

#################
# lint index.js
#################

lint "index.js";

#############
# lint core/
#############

lint "core/";

##################
# lint modules/
##################

lint "modules/";

#################
# lint lib/
#################

lint "lib/";

echoYellow "Done";

exit 0;

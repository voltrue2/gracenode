#!/bin/sh

###################
# variables
###################

name="GraceNode";
cwd=`pwd`;
# list directories/files to lint
list=();
defaultDirList="index.js core/ modules/";
# optional space separated list of directories/files to lint
# Example: ./lint.sh "mydir/ myFile" > this will lint all files in mydir/ and lint myFile
dirList=$1;


##################
# functions
##################

indexOf() {
	pos="${1%%$2*}";
	[[ $pos = $1 ]] && echo -1 || echo ${#pos};
}

echoGreen() {
	echo -en '\E[32m'"\033[1m`checkMark` $1\033[0m\n\r";
}

echoYellow() {
	echo -en '\E[33m'"\033[1m$1\033[0m\n\r";
}

echoBlue() {
	echo -en '\E[34m'"\033[1m`mark` $1\033[0m\n\r";
}

echoRed() {
	echo -en '\E[31m'"\033[1m`errorMark` $1\033[0m\n\r";
}

arrowMark() {
	echo -e "\xe2\x86\x92";
}

checkMark() {
	echo -e "\xE2\x9C\x93";
}

errorMark() {
	echo -e "\xC7\x83";
}

mark() {
	echo -e "\xCB\x83 ";
}

lint() {
	targetPath="$path$1";

	if [ -d "$targetPath" ] || [ -f "$targetPath" ]; then

		echo "linting $targetPath";

		failed=`jshint "$targetPath"`;
		if [ "$failed" ]; then
			echoRed "[error] lint error(s) in $1";
			echoRed "$failed";
			exit 1;
		else
			echoGreen "Passed [OK]";
		fi
		
	else
		echoRed "[error] $targetPath";
		echoRed "No such file or directory ($targetPath)";
		exit 1;		
	fi
}


##########################
# procedural codes
##########################

# find root path
index=`indexOf "$cwd" "$name"`;
if [ "$index" -ne -1 ]; then
	path=`expr substr $cwd 1 $index`"$name/";
else 
	path="./";
fi 

echoBlue "Current working directory: $cwd";

echoBlue "Root path: $path";

# find directories/files to lint
if [ "$dirList" ]; then
	list=($dirList);
else
	list=($defaultDirList);
fi

echoYellow "directories/files to lint:";

for item in "${list[@]}"; do
	echoBlue "${item}";
done

# start linting
echoYellow "Executing jshint...";

# lint
for item in "${list[@]}"; do
	lint "${item}";
done

echoYellow "Done";

exit 0;

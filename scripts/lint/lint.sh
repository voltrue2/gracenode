#!/bin/sh

########
# help #
########

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
	echo "";
	echo "gracenode jshint";
	echo "Description:";
	echo "Executes jshint on file changes to be commited to git and files in the given directories(optional).";
	echo "";
	echo "Usage:";
	echo "./lint <option>";
	echo "";
	echo "Options:";
	echo "	-h, --help:	Outputs a help interface.";
	echo "	-a:		Executes jshint on the given directories and/or files. Example: ./lint -d lib/ modules/";
	echo "";
	echo "Exit Status:";
	echo "	0	if OK.";
	echo "	1	if jshint fails with error(s).";
	echo "	2	if the script cannot find file(s) to lint.";
	echo "";
	exit 0;
fi


###################
# jshint location #
###################

# you can modify the jshint location using JSHINT variable
# e.g. JSHINT=./node_modules/.bin/jshint scripts/linit/lint.sh
if [ -z "$JSHINT" ]; then
	# use the default jshint (globally installed)
	JSHINT="jshint";
fi


#############
# constants #
#############

NAME="gracenode";
CWD=`pwd`;
CHECK="\xE2\x9C\x93 [OK] ";
ERROR="\xC7\x83 [ERROR] ";
MARK="\xE2\x96\xBA";

#############
# variables #
#############
# optional space separated list of directories/files with -d/--dir to lint
# if this is given, we use this list instead of DIRLIST
# e.g. ./lint.sh -d mydir/ myFile.js
# the above example will lint all files under mydir/ and lint the file called myFile.js
dirList=();
i=0;
if [ "$1" = "-a" ]; then
	for arg in "$@"; do
		if [ "$arg" != "-a" ]; then
	    		dirList[$i]=$arg;
			i=$(($i + 1));
		fi
	done
fi;

#############
# functions #
#############

# returns an index position of a given string. if there is no match -1 is returned
indexOf() {
	pos=""${1%%$2*};
	[[ $pos = $1 ]] && echo -1 || echo ${#pos};
}

log() {
	head="";
	tail="\033[0m\n\r";
	case "$1" in
		blue)
			head="\E[34m";
			;;
		green)
			head="\E[32m";
			;;
		yellow)
			head="\E[33m";
			;;
		red)
			head="\E[31m";
			;;
		*)
			head="\E[37m";
			;;
	esac
	echo -en "$head\033[1m$2$tail";
}

lintToBeCommitted() {
	if git rev-parse --verify HEAD > /dev/null 2>&1
	then
		# current head
		agains=HEAD;
	else
		# initial commit: diff against empty tree object
		against=4b825dc642cb6eb9a060e54bf8d69288fbee4904;
	fi

	# lint javascript files only
	toBeCommitted=$(git diff --cached --name-only --diff-filter=ACM | grep ".js$");

	if [ ${#toBeCommitted} -eq 0 ]; then
		log "yellow" "$MARK no changes to be committed";
	else
		log "" "liniting added files to be committed...";
	fi

	# lint the files
	for file in ${toBeCommitted}; do
		log "blue" "linting $path$file";
		`git checkout "$path$file"`;
		failed=`$JSHINT "$path$file"`;
		if [ "$failed" ]; then
			log "red" "$ERROR $path$file";
			log "red" "$failed";
			exit 1;
		else
			log "green" "$CHECK $path$file";
		fi
	done
}

lintDir() {
	target="$path$1";
	if [ -d "$target" ] || [ -f "$target" ]; then
		log "blue" "liniting $target";
		failed=`$JSHINT "$target"`;
		if [ "$failed" ]; then
			log "red" "$ERROR $target";
			log "red" "$failed";
			exit 1;
		else
			log "green" "$CHECK $target";
		fi
		
	else
		log "red" "$ERROR $target";
		log "red" "no such file or directory ($target)";
		exit 2;
	fi
}


################
# jshint check #
################

if ! type "$JSHINT" > /dev/null; then
	log "red" "$ERROR jshint command is not available";
	exit 1;
fi


#############
# root path #
#############

index=`indexOf "$CWD" "$NAME"`;
if [ "$index" -ne -1 ]; then
	path=`expr substr $CWD 1 $index`"$NAME/";
else
	path="./";
fi


##############
# operations #
##############

log "" "current working directory: $CWD";

log "" "root path: $path";

log "yellow" "$MARK lint the given directories/files";

if [ ${#dirList} -eq 0 ]; then
	log "yellow" "$MARK no directories/files to lint: use -a option to give directories/files to lint. see --help for more detail";
fi

for item in "${dirList[@]}"; do
	log "" "directory/file to lint: $path${item}";
	lintDir "${item}";
done

log "yellow" "$MARK lint changes to be committed to git";

lintToBeCommitted

log "green" "$CHECK [DONE]";

exit 0;

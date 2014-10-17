#!/bin/sh

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
DIRLIST="index.js core/ modules/";
CHECK="\xE2\x9C\x93 [OK] ";
ERROR="\xC7\x83 [ERROR] ";
MARK="\xE2\x96\xBA";

#############
# variables #
#############
# optional space separated list of directories/files to lint
# if this is given, we use this list instead of DIRLIST
# e.g. ./lint.sh "mydir/ myFile.js"
# the above example will lint all files under mydir/ and lint the file called myFile.js
dirList=$1;


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
		exit 1;
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

# find directories/files to lint
if [ "$dirList" ]; then
	list=($dirList);
else
	list=($DIRLIST);
fi

log "yellow" "$MARK lint the given directories/files";

for item in "${list[@]}"; do
	log "" "directory/file to lint: $path${item}";
	lintDir "${item}";
done

log "yellow" "$MARK lint changest to be committed to git";

lintToBeCommitted

log "green" "$CHECK [DONE]";

exit 0;

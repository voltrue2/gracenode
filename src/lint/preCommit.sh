#!/bin/sh

rootDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
jschanged=`${rootDir}/detect_js_change`;

if [ $jschanged -eq 1 ]; then
    echo "javascript files have been changed: run lint and tests";
    `echo make lint`;
    exitCode=$?;
    if [[ $exitCode != 0 ]]; then
        exit 1;
    fi
    `echo make test`;
else
    echo "No javascript files have been changed: skip lint and tests";
fi

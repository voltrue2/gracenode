pre-commit:
	echo install dependencies
	npm install	
	echo Create git pre-commit hook
	ln -s ../../scripts/lint/lint.sh .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	echo Done

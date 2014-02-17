init:
	npm install
	
	ln -s ../../scripts/lint/lint.sh .git/hooks/pre-commit	
	
	chmod +x .git/hooks/pre-commit

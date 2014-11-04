init:
	@echo 'install dependencies'
	npm install
	@echo 'create git pre-commit hook'
	ln -s ../../scripts/lint/preCommit.sh .git/hooks/pre-commit	
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'done'

.PHONY: test
test:
	./node_modules/mocha/bin/mocha test/index.js -s 10 -R spec -b --timeout 5000

init:
	@echo 'create git pre-commit hook'
	ln -s ../../scripts/lint/lint.sh .git/hooks/pre-commit	
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'done'

.PHONY: test
test:
	@echo 'test gracenode:'
	./node_modules/mocha/bin/mocha test/index.js -R spec -b

.PHONY: test-all
test-all:
	./node_modules/mocha/bin/mocha test/index.js -R spec -b
	./node_modules/mocha/bin/mocha test/server/index.js -R spec -b
	./node_modules/mocha/bin/mocha test/staticdata/index.js -R spec -b
	./node_modules/mocha/bin/mocha test/mongodb/index.js -R spec -b

.PHONY: test-module
test-module:
	@echo 'test gracenode module $(module):'
	./node_modules/mocha/bin/mocha test/$(module)/index.js -R spec -b

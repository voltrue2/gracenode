init:
	@echo 'create git pre-commit hook'
	ln -s ../../scripts/lint/lint.sh .git/hooks/pre-commit	
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'install dependencies'
	npm install
	@echo 'done'

.PHONY: test
test:
	@echo 'test gracenode:'
	./node_modules/mocha/bin/mocha test/index.js -s 10 -R spec -b

.PHONY: test-setup
test-setup:
	@echo 'test gracenode setup:'
	./node_modules/mocha/bin/mocha test/setup.js -s 10 -R spec -b

.PHONY: test-module
test-module:
	@echo 'test gracenode module $(module):'
	./node_modules/mocha/bin/mocha test/$(module)/index.js -s 10 -R spec -b

.PHONY: test-iap-apple
test-iap-apple:
	@echo 'test gracenode module iap apple:'
	./node_modules/mocha/bin/mocha test/iap/index.js -R spec -b  --path=$(path) --service=apple

.PHONY: test-iap-google
test-iap-google:
	@echo 'test gracenode module iap google:'
	./node_modules/mocha/bin/mocha test/iap/index.js -R spec -b  --key=$(key) --path=$(path) --service=google

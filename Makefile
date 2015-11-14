init:
	@echo 'install dependencies'
	npm install
	@echo 'create git pre-commit hook'
	ln -fs ../../scripts/lint/preCommit.sh .git/hooks/pre-commit
	ln -fs ../src/gracenode/index.js node_modules/gracenode	
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'done'

.PHONY: test
ifndef log
  log=false
  single=false
endif
test:
	./node_modules/mocha/bin/mocha test/index.js -s 10 -R spec -b --timeout 10000 --log=$(log) --single=$(single)

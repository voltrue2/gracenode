PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

## Set default command of make to help, so that running make will output help texts
.DEFAULT_GOAL := help

install: ## Initial installation
	@echo 'install dependencies'
	npm install
	@echo 'create git pre-commit hook'
	ln -fs ../../src/lint/preCommit.sh .git/hooks/pre-commit
	ln -fs ../src/gracenode/index.js node_modules/gracenode	
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'done'

lint: ## Execute lint against the source code
	./bin/lint index.js src/ lib/ boilerplate/api

check: ## Executes nsp to against package.json to check security issues
	./node_modules/nsp/bin/nsp check

.PHONY: test
ifndef log
  log=false
endif
ifndef single
  single=false
endif
ifndef group
  group=false
endif
test: ## Execute all unit tests. Optionally you can run: make test [single=boilerplate|start|dev|server|express|daemon|http|udp|rpc|render] [group= comma separated test names] [log=true]
	./node_modules/nsp/bin/nsp check
	./bin/lint index.js src/ lib/ boilerplate/api
	./node_modules/mocha/bin/mocha test/index.js -s 10 -R spec -b --timeout 50000 --log=$(log) --single=$(single) --group=$(group)

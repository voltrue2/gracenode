PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

## Set default command of make to help, so that running make will output help texts
.DEFAULT_GOAL := help

start: ## Start daemonized application process
	node index.js start -l daemonlogs/ -w index.js api/ templates/ configs/

stop: ## Stop daemonized application process
	node index.js stop

restart: ## Restart daemonized application process
	node index.js restart

reload: ## If in cluster mode, reload (no downtime for REST servers) daemonized application process
	node index.js reload

status: ## Output daemonized application status
	node index.js status

lint: ## Execute javascript linting against your source code
	./node_modules/gracenode/bin/lint api/ templates/

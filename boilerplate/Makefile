PHONY: lint
lint:
	./node_modules/gracenode/bin/lint api/ templates/

PHONY: start
start:
	node index.js start -l daemonlogs/ -w index.js api/ templates/ configs/

PHONE: status
status:
	node index.js status

PHONE: restart
restart:
	node index.js restart

PHONE: reload
reload:
	node index.js reload

PHONE: stop
stop:
	node index.js stop


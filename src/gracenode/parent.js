'use strict';

var parent = module.parent;
var topmostParent;
const IGNORE = 'repl';

findTopmostParent();

exports.getTopmostParent = function __getTopmostParent() {
	return topmostParent ? topmostParent.filename : null;
};

exports.getParent = function __getParent() {
	return parent ? parent.filename : null;
};

function findTopmostParent() {
	var nextParent = parent;
	while (nextParent && nextParent.id !== IGNORE) {
		topmostParent = nextParent;
		nextParent = topmostParent.parent;
	}
}

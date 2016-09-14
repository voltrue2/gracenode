'use strict';

var parent = module.parent;
var topmostParent;
var IGNORE = 'repl';

findTopmostParent();

exports.getTopmostParent = function getTopmostParent() {
	return topmostParent ? topmostParent.filename : null;
};

exports.getParent = function getParent() {
	return parent ? parent.filename : null;
};

function findTopmostParent() {
	var nextParent = parent;
	while (nextParent && nextParent.id !== IGNORE) {
		topmostParent = nextParent;
		nextParent = topmostParent.parent;
	}
}

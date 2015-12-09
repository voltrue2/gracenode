'use strict';

var parent = module.parent;
var topmostParent;
var IGNORE = 'repl';

findTopmostParent();

exports.getTopmostParent = function () {
	return topmostParent ? topmostParent.filename : null;
};

exports.getParent = function () {
	return parent ? parent.filename : null;
};

function findTopmostParent() {
	var nextParent = parent;
	while (nextParent && nextParent.id !== IGNORE) {
		topmostParent = nextParent;
		nextParent = topmostParent.parent;
	}
}

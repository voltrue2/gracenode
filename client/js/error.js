(function () {

var errorEvents = new window.EventEmitter();

window.errorEvents = errorEvents;

window.onerror = function (msg, url, line) {
	errorEvents.emit('error', { msg: msg, url: url, line: line });
	// let the default handler to run
	return false;
};

function getStackTrace() {
	var obj = {};
	Error.captureStackTrace(obj, getStackTrace);
	return obj.stack;
}

}());

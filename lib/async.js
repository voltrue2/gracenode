'use strict';

// i am only doing this to minimize the risk of dependencies...

module.exports.forEach = function __asyncForEach(list, handler, done) {
	// counter of finished tasks
	var counter = 0;
	const len = list.length;

	if (!len) {
		return done();
	}

	const iterator = function __asyncForEachIterator(i, list, handler, done) {
		var item = list[i];
		handler(item, function __asyncForEachHandler(error) {
			if (error) {
				return done(error);
			}
			counter += 1;
			if (counter === len) {
				done();
			}
		});
	};
	for (var i = 0; i < len; i++) {
		iterator(i, list, handler, done);
	}
};

module.exports.each = module.exports.forEach;

module.exports.eachSeries = function __asyncEachSeries(list, handler, done) {
	
	if (!list.length) {
		return done();
	}

	iteratorSeries(0, list, handler, done);
};

module.exports.series = function __asyncSeries(list, done) {
	
	if (!list.length) {
		return done();
	}

	handlerSeries(0, list, done);
};

function iteratorSeries(i, list, handler, done) {
	const len = list.length;
	handler(list[i], function __asyncIteratorSeriesHandler(error) {
		if (error) {
			return done(error);
		}
		i += 1;
		if (i === len) {
			return done();
		}
		iteratorSeries(i, list, handler, done);
	});
}

function handlerSeries(i, list, done) {
	const len = list.length;
	const handler = list[i];
	handler(function __asyncHandlerSeriesHandler(error) {
		if (error) {
			return done(error);
		}
		i += 1;
		if (i === len) {
			return done();
		}
		handlerSeries(i, list, done);
	});
}

'use strict';

var routes = [];
var hooks = {};

exports.define = function (path) {
	var res = {
		path: null,
		pattern: null,
		paramNames: []
	};
	var headingSlash = path[0] === '/' ? '' : '/';
	var trailingSlash = path[path.length - 1] === '/' ? '' : '/';
	var paramNames = path.match(/{(.*?)}/g) || [];
	for (var i = 0, len = paramNames.length; i < len; i++) {
		res.paramNames.push(paramNames[i].substring(1, paramNames[i].length - 1));
	}
	res.pattern = headingSlash + path.replace(/{(.*?)}/g, '(.*?)').replace(/\//g, '\\/') + trailingSlash;
	res.path = headingSlash + path.replace(/\/{(.*?)}/g, '');	

	routes.push(res);
};

exports.hook = function (path, func) {
	// root exception
	if (path === '/') {
		if (!hooks.hasOwnProperty(path)) {
			hooks[path] = [];
		}
		if (Array.isArray(func)) {
			hooks[path] = hooks[path].concat(func);
		} else {
			hooks[path].push(func);
		}
		return;
	}
	var headingSlash = path[0] === '/' ? '' : '/';
	var hookPath = headingSlash + path.replace(/\/{(.*?)}/g, '');
	var len = hookPath.length - 1;
	hookPath = (hookPath[len] === '/') ? hookPath.substring(0, len) : hookPath;
	// add the hook function to exact match
	if (!hooks.hasOwnProperty(hookPath)) {
		hooks[hookPath] = [];
	}
	hooks[hookPath].push(func);
};

exports.parse = function (fullPath) {
	fullPath = encodeURI(fullPath);
	var parsed = {
		query: {},
		params: {}
	};
	var queryIndex = fullPath.indexOf('?');
	var queryList = (queryIndex === -1) ? [] : fullPath.substring(queryIndex + 1).split('&');
	var path = ((queryIndex === -1) ? fullPath : fullPath.substring(0, queryIndex));
	path += (path[path.length - 1] === '/') ? '' : '/';
	var matched = false;
	for (var j = 0, jen = routes.length; j < jen; j++) {
		if (path.search(routes[j].pattern) === 0) {
			var res = path.match(routes[j].pattern);
			// first element is the matched string
			// discard it
			res.shift();
			parsed.origin = decodeURI(path);
			parsed.path = routes[j].path;
			for (var k = 0, ken = routes[j].paramNames.length; k < ken; k++) {
				parsed.params[routes[j].paramNames[k]] = decodeURI(res[k]) || null;
			}
			matched = true;
			break;
		}
	}
	if (!matched) {
		return null;
	}
	for (var i = 0, len = queryList.length; i < len; i++) {
		var sep = queryList[i].split('=');
		parsed.query[sep[0]] = sep[1];
	}
	parsed.hooks = findHooks(parsed.path);
	return parsed;
};

function findHooks(parsedPath) {
	var matchedHooks = [];
	for (var path in hooks) {
		if (parsedPath.indexOf(path) === 0) {
			matchedHooks = matchedHooks.concat(hooks[path]);
		}
	}
	return matchedHooks;
}

/*
for (var i = 0; i < 200; i++) {
	exports.define('/vv/' + i);
	exports.hook('/vv/' + i, function () {});
}
exports.define('/a/b/{C}/d/e/{F}/{G}/h');
exports.define('/abc/def/ghijkl/{word}');
exports.define('/test/{name}');
exports.hook('a/b/{C}', function ab() {});
exports.hook('/test/{name}', function test() {});
exports.hook('/', function all() {});
exports.hook('/a/b/{C}/d/e/{F}/{G}/h', function abdeh() {});

var s = Date.now();
console.log(exports.parse('/a/b/c/d/e/f/g?z=10&y=20'));
console.log('no match >>>>>>>>>>>>>', Date.now() - s + ' ms');
s = Date.now();
console.log(exports.parse('/a/b/c/d/e/f/g/?z=10&y=20'));
console.log('no match >>>>>>>>>>>>>', Date.now() - s + ' ms');
s = Date.now();
console.log(exports.parse('/a/b/c/d/e/日本語/g'));
console.log('no match >>>>>>>>>>>>>', Date.now() - s + ' ms');
s = Date.now();
console.log(exports.parse('/abc/def/ghijkl/i_am_a_param'));
console.log('match >>>>>>>>>>>>>', Date.now() - s + ' ms');
s = Date.now();
console.log(exports.parse('/abc/def/ghijkl/i_am_a_param/hmmm'));
console.log('match >>>>>>>>>>>>>', Date.now() - s + ' ms');
s = Date.now();
console.log(exports.parse('/a/b/XXX/d/e/YYY/ZZZ/h'));
console.log('match >>>>>>>>>>>>>', Date.now() - s + ' ms');
s = Date.now();
console.log(exports.parse('/a/b/日本語/d/e/英語/ZZZ/h?id=100&name=fff'));
console.log('match >>>>>>>>>>>>>', Date.now() - s + ' ms');
s = Date.now();
console.log(exports.parse('/test/fff/a/b/XXX/d/e/YYY/ZZZ/h'));
console.log('no match >>>>>>>>>>>>>', Date.now() - s + ' ms');
s = Date.now();
console.log(exports.parse('/test/KeithJarrett/1/2/3/4/5/6/7/8/9/0/?type=piano&genre=jazz'));
console.log('match >>>>>>>>>>>>>', Date.now() - s + ' ms');
*/


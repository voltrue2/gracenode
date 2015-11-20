'use strict';

var req = require('../request');
var step = 0;
var stepList = [
	'gzip',
	'method',
	'url',
	'params',
	'headers'
];
var methods = [
	'GET',
	'HEAD',
	'POST',
	'PUT',
	'DELETE',
	'PATCH'
];
var msg = [
	'Support gzip: ',
	'Request method: ',
	'Request URI: ',
	'Request body? Example: parameterName=parameterValue&parameterName2=parameterValue2...: ',
	'Request headers? Example: headerName=headerValue&headerName2=headerValue2...: ',
	'Sending the request'
];

var host = process.argv[2];
var args = {};
var remember = {};

if (!host) {
	exit(new Error('HTTP command client needs host as the first argument: Example localhost:8000'));
}

console.log(msg[step]);

process.stdin.on('data', function (input) {
	input = input.toString().replace(/\n/, '');
	if (input.indexOf('repeat:') === 0) {
		var url = input.replace('repeat:', '');
		var rem = remember[url];
		if (!rem) {
			console.log(remember);
			return exit(new Error('Invalid request memory: ' + url));
		}
		args.gzip = rem.gzip;
		args.method = rem.method;
		args.url = 'http://' + host + url;
		args.params = rem.params;
		args.headers = rem.headers;
		console.log('Repeating request [gzip:' + args.gzip + ']:', args.method, args.url, args.params, args.headers);
		return sendRequest();
	}
	handleInputPerStep(input);
});

function handleInputPerStep(val) {
	var type = stepList[step];
	switch (type) {
		case 'gzip':
			if (val === 'true') {
				args.gzip = true;
			} else {
				args.gzip = false;
			}
			break;
		case 'method':
			if (methods[val] === -1) {
				exit(new Error('Invalid request method: ' + val));
			}
			args.method = val;
			break;
		case 'url':
			args.url = 'http://' + host + val;
			break;
		case 'params':
			/* foramt: paramName=paramValue&... */
			args.params = parse(val);
			break;
		case 'headers':
			args.headers = parse(val);
			break;
	}
	step += 1;

	console.log(msg[step]);

	if (step === stepList.length) {
		sendRequest();		
	}
}

function parse(val) {
	var sep = val.split('&');
	var map = {};
	for (var i = 0, len = sep.length; i < len; i++) {
		var items = sep[i].split('=');
		map[items[0]] = items[1];
	}
	return map;
}

function sendRequest() {

	if (!args.method || !args.url) {
		//reset
		step = 0;
		console.log('Next request');
		console.log(msg[step]);
		return;
	}

	var opts = {
		gzip: args.gzip,
		headers: args.headers
	};
	remember[args.url.replace('http://' + host, '')] = {
		method: args.method,
		params: args.params || null,
		gzip: args.gzip,
		headers: args.headers
	};
	req[args.method](args.url, args.params, opts, function (error, res, st, headers) {
		if (error) {
			console.error('Error:', error);
		}
		console.log('Status Code:', st);
		console.log(JSON.stringify(headers, null, 2));
		console.log(res);
		//reset
		step = 0;
		console.log('Next request');
		console.log(msg[step]);		
	});
}

function exit(error) {
	console.log('[ Exit ]');

	if (error) {
		console.error('Error:', error);
	}

	process.exit(error);
}

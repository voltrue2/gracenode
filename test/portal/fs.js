'use strict';

const fs = require('fs');
const PATH = __dirname + '/';
const BR = '\n';

module.exports = Fs;

function Fs(name) {
	this.path = PATH + name;
}

Fs.prototype.write = function (data, cb) {
	fs.appendFile(this.path, JSON.stringify(data) + BR, 'utf8', cb);
};

Fs.prototype.read = function (cb) {
	fs.readFile(this.path, 'utf8', function (error, data) {
		if (error) {
			return cb(error);
		}
		try {
			const tmp = data.split(BR);
			const list = [];
			for (var i = 0, len = tmp.length; i < len; i++) {
				if (!tmp[i]) {
					continue;
				}
				list.push(JSON.parse(tmp[i]));
			}
			cb(null, list);
		} catch (error) {
			cb(error);
		}
	});
};

Fs.prototype.delete = function (cb) {
	fs.unlink(this.path, cb);
};

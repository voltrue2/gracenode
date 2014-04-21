
var uglify = require('uglify-js');
var fs = require('fs');
var async = require('async');
var gracenode = require('../../');
var log = gracenode.log.create('view');
var parserSource = require('./parser');

/*
* configurations
* view: { // optional
*	preloads: ["filepath"...]
*	minify: true/false // optional > default is true
*}
* 
* Parser class handles these
* (:include filePath:) included in the html
* (:= variable name:) replaced with the value of clientData with the same name
* 
*/

var viewList = {};
var config = null;

module.exports.readConfig = function (configIn) {
	config = configIn;
};

module.exports.setup = function (cb) {
	if (config && config.preloads && config.preloads.length) {
		log.verbose('preload view files');
		return async.eachSeries(config.preloads, function (path, nextCallback) {
			gracenode.lib.walkDir(gracenode.getRootPath() + path, function (error, list) {
				if (error) {
					return cb(error);
				}
				async.eachSeries(list, function (item, next) {
					var path = item.file;
					// get file modtime in unix timestamp
					var dateObj = new Date(item.stat.mtime);
					var mtime = dateObj.getTime();
					// create memory cache key
					var key = path + mtime;
					fs.readFile(path, { encoding: 'utf8' }, function (error, file) {
						if (error) {
							return cb(new Error('[' + path + '] ' + error));
						}
						var fileType = path.substring(path.lastIndexOf('.') + 1);
						// process file to optimize the output
						var content = processFile(fileType, file);
						// store in memory cache
						viewList[key] = content;
						log.verbose('view output data stored in cache: ', key);
						next();
					});	
				}, nextCallback);
			});
		}, cb);
	}
	cb();
};

module.exports.create = function () {
	return new View();
};

function View() {
	this._data = {};
}

View.prototype.assign = function (name, value) {
	this._data[name] = value;
};

View.prototype.get = function (name) {
	if (this._data[name]) {
		return gracenode.lib.cloneObj(this._data[name]);
	}
	return null;
};

View.prototype.load = function (viewFilePath, cb) {
	var seen = [];
	load(viewFilePath, seen, this._data, cb);
};

function load(viewFilePath, seen, clientData, cb) {
	// validate callback
	if (typeof cb !== 'function') {
		log.error('function load is missing callback');
		throw new Error('missing callback');
	}
	// create the source path
	var path = gracenode.getRootPath() + viewFilePath;
	
	log.verbose('loading a view file: ', path);

	// view file parser
	var parser = parserSource.create(clientData);
	
	// start loading
	var outputData = '';
	gracenode.lib.walkDir(path, function (error, list) {
		if (error) {
			return cb(error);
		}
		async.eachSeries(list, function (item, nextCallback) {
			readFile(item.file, item.stat, parser, seen, clientData, function (error, data) {
				if (error) {
					return cb(error);
				}
				outputData += data;
				nextCallback();
			});
		},
		function (error) {
			if (error) {
				return cb(error);
			}
			cb(null, outputData);
		});
	});	
}

function readFile(path, stat, parser, seen, clientData, cb) {
	// content data
	var content = null;
	// get file modtime in unix timestamp
	var dateObj = new Date(stat.mtime);
	var mtime = dateObj.getTime();
	// create memory cache key
	var key = path + mtime;

	// check if we have included this file for this view
	if (seen.indexOf(key) !== -1) {
		log.verbose('file already included [' + key + ']: ignored');
		return cb(null, '');
	}
	seen.push(key);
	
	// check for cache in memory
	content = viewList[key] || null;		
	if (content) {
		// cache found > use it
		log.verbose('view output data found in cache: ', key);
		// handle included files
		return parseContent(content, parser, seen, clientData, function (error, contentData) {
			if (error) {
				return cb(error);
			}	
			cb(null, contentData);
		});
	}	

	// no cached data found > read the file
	fs.readFile(path, { encoding: 'utf8' }, function (error, file) {
		if (error) {
			return cb(new Error('failed to load view file: [' + path + ']\n' + JSON.stringify(error, null, 4)));
		}
		var fileType = path.substring(path.lastIndexOf('.') + 1);
		// process file to optimize the output
		content = processFile(fileType, file);
		// store in memory cache
		viewList[key] = content;
		log.verbose('view output data stored in cache: ', key);
		// handle included files
		parseContent(content, parser, seen, clientData, function (error, contentData) {
			if (error) {
				return cb(error);
			}	
			cb(null, contentData);
		});
	});
}

function embedData(outputData, clientData) {
	// prepare for embedding all the variables in the view template
	var clientVars = '<script type="text/javascript">window.gracenode = ' + JSON.stringify(clientData) + ';</script>';
	
	// remove HTML comments
	outputData = outputData.replace(/<!--[\s\S]*?-->/g, '');

	// embed
	return outputData.replace('</head>', clientVars + '\n</head>', 'i');
}

function parseContent(outputData, parser, seen, clientData, cb) {
	outputData = embedData(outputData, clientData);
	var result = parser.parseData(outputData);
	var list = result.includeList;
	outputData = result.data;
	
	// include files asynchronously
	async.eachSeries(list, function (item, next) {
		var tag = item.tag;
		var path = item.path;
	
		load(path, seen, clientData, function (error, data) {
			if (error) {
				return cb(error);
			}
		
			// FIXME: a sad, really sad way to make sure ALL the tags be replaced....	
			outputData = insertData(outputData, tag, tag.length, data);			
	
			next();
		});
	}, 
	function (error) {
		if (error) {
			return cb(error);
		}
		cb(null, outputData);
	});
}

function insertData(content, tag, len, data) {
	var index = content.indexOf(tag);
	if (index === -1) {
		return content;
	}
	var head = content.substring(0, index);
	var tail = content.substring(index + len);
	content = head + data + tail;
	return insertData(content, tag, len, data);
}

function processFile(type, data) {
	switch (type) {
		case 'js':
			try {
				if (config.minify !== false) {
					// FIX ME: too slow
					data = uglify.minify(data, { fromString: true }).code;
				}
			} catch (exp) {
				log.error('failed to minify a js file:', exp);
			}
			break;	
		case 'css':
		case 'html':
			// remove line breaks and tabs
			data = data.replace(/(\r\n|\n|\r|\t)/gm, '');
			break;
		case 'png':
		case 'gif':
		case 'jpg':
		case 'jpeg':
			var bin = new Buffer(data, 'binary').toString('base64');
			data = 'data:image/.' + type + ';base64,' + bin;
			break;
	}
	return data;
}

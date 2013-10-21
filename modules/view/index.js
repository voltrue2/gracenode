
var uglify = require('uglify-js');
var fs = require('fs');
var async = require('async');
var gracenode = require('../../gracenode');
var log = gracenode.log.create('view');
var parserSource = require('./parser');

/*
* configurations
* view: { // optional
*	preloads: ["filepath"...]
*}
*
* <:var:> embed clientData in the html as javascript variables
* 
* Parser class handles these
* (:include filePath:) included in the html
* (:= variable name:) replaced with the value of clientData with the same name
* 
*/

var viewList = {};
var clientData = {};
var config = null;

module.exports.readConfig = function (configIn) {
	config = configIn;
};

module.exports.setup = function (cb) {
	if (config && config.preloads && config.preloads.length) {
		log.verbose('preload view files');
		return async.forEach(config.preloads, function (path, nextCallback) {
			gracenode.lib.walkDir(gracenode.getRootPath() + path, function (error, list) {
				if (error) {
					return cb(error);
				}
				async.forEach(list, function (item, next) {
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
						content = processFile(fileType, file);
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

module.exports.assign = function (name, value) {
	clientData[name] = value;
};

module.exports.load = function (viewFilePath, cb) {
	var seen = [];
	load(viewFilePath, seen, cb);
};

function load (viewFilePath, seen, cb) {
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
		async.forEachSeries(list, function (item, nextCallback) {
				readFile(item.file, item.stat, parser, seen, function (error, data) {
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

function readFile(path, stat, parser, seen, cb) {
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
		return parseContent(content, parser, seen, function (error, contentData) {
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
		parseContent(content, parser, seen, function (error, contentData) {
			if (error) {
				return cb(error);
			}	
			cb(null, contentData);
		});
	});
}

function embedData(outputData) {
	// prepare for embedding all the variables in the view template
	var clientVars = '<script type="text/javascript">';
	for (var key in clientData) {
		clientVars += 'window.' + key + '=' + JSON.stringify(clientData[key]) + ';';
	}
	clientVars += '</script>';
	
	// remove HTML comments
	outputData = removeHTMLComments(outputData);

	// embed
	return outputData.replace('<:var:>', clientVars);
}

function removeHTMLComments(outputData) {
	return outputData.replace(/<!--[\s\S]*?-->/g, '');
}

function parseContent(outputData, parser, seen, cb) {
	outputData = embedData(outputData);
	var result = parser.parseData(outputData);
	var list = result.includeList;
	outputData = result.data;
	// include files asynchronously
	async.forEachSeries(list, function (item, next) {
		var tag = item.tag;
		var path = item.path;
			
		gracenode.profiler.mark('start include: ' + path);
		
		load(path, seen, function (error, data) {
			if (error) {
				return cb(error);
			}
			
			gracenode.profiler.mark('include complete: ' + path);
		
			outputData = outputData.replace(tag, data);
			
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

function processFile(type, data) {
	switch (type) {
		case 'js':
			try {
				// FIX ME: too slow
				data = uglify.minify(data, { fromString: true }).code;
			} catch (exp) {
				log.error('failed to minify a js file:', exp);
			}
			break;	
		case 'css':
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

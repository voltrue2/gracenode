
var uglify = require('uglify-js');
var fs = require('fs');
var async = require('async');
var gracenode = require('../../gracenode');
var log = gracenode.log.create('view');
var parserSource = require('./parser');

/*
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

module.exports.assign = function (name, value) {
	clientData[name] = value;
};

module.exports.load = function (viewFilePath, cb) {
	// validate callback
	if (typeof cb !== 'function') {
		log.error('function load is missing callback');
		throw new Error('missing callback');
	}
	// create the source path
	var path = gracenode.getRootPath() + viewFilePath;
	
	log.verbose('loading a view file: ', path);

	var parser = parserSource.create(clientData);

	// check memory cache with file modtime
	fs.lstat(path, function (error, stat) {
		if (error) {
			return cb(new Error('failed to read the file stat: [' + path + ']\n' + JSON.stringify(error, null, 4)));
		}
		// content data
		var content = null;
		// get file modtime in unix timestamp
		var dateObj = new Date(stat.mtime);
		var mtime = dateObj.getTime();
		// create memory cache key
		var key = path + mtime;
		// check for cache in memory
		content = viewList[key] || null;		
		if (content) {
			// cache found > use it
			log.verbose('view output data found in cache: ', key);
			// handle included files
			return parseContent(content, parser, function (error, contentData) {
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
			viewList[key] = file;
			log.verbose('view output data stored in cache: ', key);
			// handle included files
			parseContent(content, parser, function (error, contentData) {
				if (error) {
					return cb(error);
				}	
				cb(null, contentData);
			});
		});
	});
};

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
};

function removeHTMLComments(outputData) {
	return outputData.replace(/<!--[\s\S]*?-->/g, '');
}

function parseContent(outputData, parser, cb) {
	outputData = embedData(outputData);
	var result = parser.parseData(outputData);
	var list = result.includeList;
	outputData = result.data;
	// include files asynchronously
	async.forEachSeries(list, function (item, next) {
		var tag = item.tag;
		var path = item.path;
			
		gracenode.profiler.mark('start include: ' + path);
		
		module.exports.load(path, function (error, data) {
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
				data = uglify.minify(data, { fromString: true }).code;
			} catch (exp) {
				log.error('failed to minify a js file:', exp);
			}
			break;	
		case 'css':
			// remove line breaks and tabs
			data = data.replace(/(\r\n|\n|\r|\t|\ )/gm, '');	
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

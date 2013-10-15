
var uglify = require('uglify-js');
var fs = require('fs');
var async = require('async');
var gracenode = require('../../gracenode');
var log = gracenode.log.create('view');

/*
*
* <:var:> embed clientData in the html as javascript variables
* <:include filePath:> included in the html
* (:variable name:) replaced with the value of clientData with the same name
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

	// check memory cache with file modtime
	fs.lstat(path, function (error, stat) {
		if (error) {
			return cb(new Error('failed to read the file stat: ' + path + '\n' + JSON.stringify(error, null, 4)));
		}
		// content data
		var content = null;
		// get file modtime in unix timestamp
		var dateObj = new Date(stat.mtime);
		var mtime = dateObj.getTime();
		// create memory cache key
		var key = path + mtime;
		// check for cache in memory
		content = viewList[key];		
		if (content) {
			// cache found > use it
			log.verbose('view output data found in cache: ', key);
			content = embedData(content);
			// handle included files
			return handleIncludedFiles(content, function (error, contentData) {
				if (error) {
					return cb(error);
				}	
				cb(null, contentData);
			});
		}	

		var fileType = path.substring(path.lastIndexOf('.') + 1);

		// no cached data found > read the file
		fs.readFile(path, { encoding: 'utf8' }, function (error, file) {
			if (error) {
				return cb(new Error('failed to load view file: ' + path + '\n' + JSON.stringify(error, null, 4)));
			}
			// process file to optimize the output
			file = processFile(fileType, file);
			// store in memory cache
			viewList[key] = file;
			log.verbose('view output data stored in cache: ', key);
			// prepare content
			content = embedData(file);		
			// handle included files
			handleIncludedFiles(content, function (error, contentData) {
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
	
	// inject client data
	outputData = injectData(outputData);

	// embed
	return outputData.replace('<:var:>', clientVars);
};

function removeHTMLComments(outputData) {
	return outputData.replace(/<!--[\s\S]*?-->/g, '');
}

function injectData(outputData) {
	var open = '(:';
	var close = ':)';
	var openIndex = outputData.indexOf(open);
	var closeIndex = outputData.indexOf(close);
	while (openIndex !== -1 && closeIndex !== -1) {
		var tag = outputData.substring(openIndex, closeIndex + 2);
		var keyTag = tag.substring(2, tag.length - 2);
		var keys = keyTag.split('.');
		var value = '(?' + keyTag + '?)'; // if no match was found > replace it with (?tagName?)
		if (clientData[keys[0]] !== undefined) {
			value = clientData[keys[0]];
			if (typeof value === 'object') {
				for (var i = 0, len = keys.length; i < len; i++) {
					if (value[keys[i]] !== undefined) {
						value = value[keys[i]];
					}
				}
			}
		}
		outputData = outputData.replace(tag, value);
		openIndex = outputData.indexOf(open);
		closeIndex = outputData.indexOf(close);
	}
	return outputData;
}

function handleIncludedFiles(outputData, cb) {
	// regex is cleaner but cannot handle multiple tags in one line...
	//var list = outputData.match(/\<(\:([^>]+)\:\>)/ig);
	var open = '<:include';
	var close = ':>';
	var openIndex = outputData.indexOf(open);
	var closeIndex = outputData.indexOf(close);
	var list = [];
	while (openIndex !== -1 && closeIndex !== -1) {
		var tag = outputData.substring(openIndex, closeIndex + 2);
		var replaceTag = '<?' + tag.substring(2, tag.length - 2) + '?>';
		list.push(replaceTag);
		outputData = outputData.replace(tag, replaceTag);
		openIndex = outputData.indexOf(open);
		closeIndex = outputData.indexOf(close);
	}
	// include files synchronously
	async.forEachSeries(list, function (tag, next) {
		var path = tag.substring(10, tag.length - 2);
		module.exports.load(path, function (error, data) {
			if (error) {
				return cb(error);
			}
			outputData = outputData.replace(tag, data);
			
			gracenode.profiler.mark('include: ' + path);
			
			next();
		});
	}, 
	function (error) {
		if (error) {
			return cb(error);
		}
		gracenode.profiler.mark('include');
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


var fs = require('fs');
var async = require('async');
var gracenode = require('../../gracenode');
var log = gracenode.log.create('view');

/*
*
* <:var:> embed clientData in the html as javascript variables
* <:include file path:> included in the html
* (:variable name:) replaced with the value of clientData with the same name
* 
*/

var viewList = {};
var clientData = {};

exports.assign = function (name, value) {
	clientData[name] = value;
	log.verbose('assinging cilent data: ' + name + ' = ', value);
};

exports.load = function (viewFilePath, cb) {
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
		
		// get file modtime in unix timestamp
		var dateObj = new Date(stat.mtime);
		var mtime = dateObj.getTime();
		// create memory cache key
		var key = path + mtime;
		// check for cache in memory
		var outputData = viewList[key];		
		if (outputData) {
			// cache found > use it
			log.verbose('view output data found in cache: ', key);
			return cb(null, embedData(viewList[key]));
		}	

		// no cached data found > read the file
		fs.readFile(path, { encoding: 'utf8' }, function (error, file) {
			if (error) {
				return cb(new Error('failed to load view file: ' + path + '\n' + JSON.stringify(error, null, 4)));
			}
			// store in memory cache
			viewList[key] = file;
			log.verbose('view output data stored in cache: ', key);
	
			// prepare content
			var content = embedData(file);		
			
			// remove line breaks and tabs
			content = content.replace(/(\r\n|\n|\r)/gm, '');	

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
	
	// inject client data
	outputData = injectData(outputData);

	// embed
	return outputData.replace('<:var:>', clientVars);
};

function injectData(outputData) {
	outputData = outputData.replace(/(\(\:([^>]+)\:\))/ig, function (match) {
		var keyTag = match.substring(2, match.length - 2);
		var keys = keyTag.split('.');
		var value = keyTag; // if no match was found > replace it with the original tag so nothing changes
		if (clientData[keys[0]]) {
			value = clientData[keys[0]];
			if (typeof value === 'object') {
				for (var i = 0, len = keys.length; i < len; i++) {
					if (value[keys[i]] !== undefined) {
						value = value[keys[i]];
					}
				}
			}
		}		
		log.verbose('inject client data: ', keyTag + ' > ' + value);
		return value;		
	});
	return outputData;
}

function handleIncludedFiles(outputData, cb) {
	var list = outputData.match(/\<(\:([^>]+)\:\>)/ig);
	if (!list) {
		return cb(null, outputData);
	}
	async.forEachSeries(list, function (tag, next) {
		var path = tag.substring(10, tag.length - 2);
		exports.load(path, function (error, data) {
			if (error) {
				return cb(error);
			}
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

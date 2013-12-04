
var gracenode = require('../../');
var log = gracenode.log.create('server-response');

var zlib = require('zlib');

var contentTypes = {
	JSON: 'JSON',
	HTML: 'HTML',
	FILE: 'FILE',
	ERROR: 'ERROR'
};

var imageFiles = [
	'gif',
	'png',
	'jpg',
	'jpeg'
];

var dynamicContentHeaders = {
	'Cache-Control': 'no-cache, must-revalidate',
    'Connection': 'Keep-Alive',
	'Content-Encoding': 'gzip',
	'Content-Type': 'text/plain;charset=UTF-8',
	'Pragma': 'no-cache',
	'Vary': 'Accept-Encoding'
};

module.exports.respond = function (req, res, content, contentType, status) {

	log.verbose('response content type:', contentType);

	switch (contentType) {
		case contentTypes.JSON:
			respondJSON(req, res, content, status);
			break;
		case contentTypes.HTML:
			respondHTML(req, res, content, status);
			break;
		case contentTypes.FILE:
			respondFILE(req, res, content, status);
			break;
		case contentTypes.ERROR:
			respondERROR(req, res, content, status);
			break;
		default:
			// TODO: consider better way to handle this...
			
			log.error('unkown content type:', contentType);			

			respondERROR(req, res, content, status);
			break;
	}

	res.emit('end');	
};

function compressContent(content, cb) {
	zlib.gzip(content, function (error, compressedData) {
		if (error) {
			return cb(error);
		}
	
		log.verbose('compressed content size: ' + (compressedData.length / 1024) + ' KB');

		cb(null, compressedData);
	});
}

function respondJSON(req, res, content, status) {
	status = status || 200;
	compressContent(JSON.stringify(content), function (error, data) {
		
		if (error) {
			log.error(error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'text/plain; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		responseLog(req, status);		

		res.end(data, 'binary');		

	});

}

function respondHTML(req, res, content, status) {
	status = status || 200;
	compressContent(content, function (error, data) {
		
		if (error) {
			log.error(error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'text/html; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		responseLog(req, status);		

		res.end(data, 'binary');		

	});
}

function respondFILE(req, res, content, status) {
	status = status || 200;
	var type = req.url.substring(req.url.lastIndexOf('.') + 1);
	var contentSize = content.length;
	res.writeHead(status, {
		'Content-Length': contentSize,
		'Content-Type': getFileType(type)
	});
	
	log.verbose('response content size: ' + (contentSize / 1024) + ' KB');

	responseLog(req, status);		

	res.end(content, 'binary');

}

function respondERROR(req, res, content, status) {
	status = status || 404;
	compressContent(content, function (error, data) {
		
		if (error) {
			log.error(error);
			status = 500;
			data = error;
		}

		var contentSize = data.length;
		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'text/plain; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});
		
		log.error('response content size: ' + (contentSize / 1024) + ' KB');
	
		responseLog(req, status);		
	
		res.end(data, 'binary');

	});
}

function responseLog(req, status) {
	var msg = 'response: ' + req.url + ' (status: ' + status + ')';
	if (status >= 400) {
		log.error('error ' + msg);
	} else {
		log.info(msg);
	}
}

function getFileType(type) {
	if (imageFiles.indexOf(type) !== -1) {
		// image file
		return 'image/' + type;
	}
	// other file types
	// TODO: implement...
	return null;
}

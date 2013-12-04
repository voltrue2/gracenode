
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

	res.on('end', function () {
		log.debug(arguments);
		log.info('responded to ' + req.url);
	});

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

		log.info('response: ' + req.url + ' ' + status);

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

		log.info('response: ' + req.url + ' ' + status);

		res.end(data, 'binary');		

	});

	/*
	var contentSize= Buffer.byteLength(content);

	res.writeHead(status, {
		'Cache-Control': 'no-cache, must-revalidate',
		'Connection': 'Keep-Alive',
		'Content-Type': 'text/html; charset=UTF-8',
		'Pragma': 'no-cache',
		'Vary': 'Accept-Encoding',
		'Content-Length': contentSize
	});
	
	log.verbose('response content size: ' + (contentSize / 1024) + ' KB');

	res.end(content, 'binary');
	*/
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

	log.info('response: ' + req.url + ' ' + status);

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
			'Content-Length': contentSize,
			'Content-Type': 'text/plain;charset=UTF-8',
		});
		
		log.error('response content size: ' + (contentSize / 1024) + ' KB');

		log.info('response: ' + req.url + ' ' + status);
		
		res.end(content, 'binary');

	});
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

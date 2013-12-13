
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

module.exports.respond = function (req, res, content, contentType, status, contentModtime) {

	log.verbose('response content type:', contentType);

	/* FIXME: it does not work properly at the moment probably missing some required headers
	contentModtime = handleContentModtime(res, contentModtime);

	notModified = checkNotModified(req, res, contentModtime);

	if (notModified) {
		respondNotModified(req, res);
		res.emit('end');
		return;
	}
	*/

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

// if content has not been modified, respond with 304
function checkNotModified(req, res, contentModtime) {
	var ifMod = req.headers['if-modified-since'] || null;
	if (ifMod) {
		var lastMod = new Date(contentModtime).getTime();
		var clientMod = new Date(ifMod).getTime();
		if (lastMod <= clientMod) {
			log.verbose('content has not been modified [' + req.url + ']: 304');
			return true;
		}
	}
	return false;	
}

function handleContentModtime(res, contentModtime) {
	if (contentModtime) {
		contentModtime = new Date(contentModtime);
		contentModtime = contentModtime.toGMTString();
	
		log.verbose('content GMT modtime:', contentModtime);
		
		res.setHeader('Last-Modified', contentModtime);
	}
	return contentModtime;
}

function compressContent(content, cb) {
	zlib.gzip(content, function (error, compressedData) {
		if (error) {
			return cb(error);
		}
	
		log.verbose('compressed content size: ' + (compressedData.length / 1024) + ' KB');

		cb(null, compressedData);
	});
}

function respondNotModified(req, res) {
	res.statusCode = 304;
	responseLog(req, 304);
	res.end();
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
	switch (type) {
		case 'png':
		case 'gif':
		case 'jpg':
		case 'jpeg':
			return 'image/' + type;
		case 'mp3':
			return 'audio/mpeg';
		case 'wav':
			return 'audio/wav';
		case 'ogg':
			return 'application/ogg';
		case 'oga':
		case 'ogv':
			return 'audio/ogg';
		case 'midi':
			return 'audio/midi';
		case 'pdf':
			return 'application/pdf';
		case 'mpeg4':
		case 'mpeg2':
			return 'video/mpeg';
		case 'css':
			return 'text/css';
		case 'js':
			return 'text/javascript';
		case 'html':
			return 'text/html';
		case 'xml':
			return 'text/xml';
		default:
			return 'text/plain';	
	}
	/*
	if (imageFiles.indexOf(type) !== -1) {
		// image file
		return 'image/' + type;
	}
	// other file types
	// TODO: implement...
	return null;
	*/
}

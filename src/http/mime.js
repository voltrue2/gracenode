const app = 'application/';
const aud = 'audio/';
const tx = 'text/';
const img = 'image/';
const vd = 'video/';
const map = {
	'atom+xml': app,
	'ecmascript': app,
	'EDI-X12': app,
	'EDIFACT': app,
	'json': app,
	'javascript': app,
	'octet-stream': app,
	'pdf': app,
	'postscript': app,
	'rdf+xml': app,
	'rss': app,
	'soap+xml': app,
	'font-woff': app,
	'xhtml+xml': app,
	'xml-dtd': app,
	'xop+xml': app,
	'zip': app,
	'gzip': app,
	'example': app,
	'xnacl': app,
	'basic': aud,
	'L24': aud,
	'opus': aud,
	'ogg': aud,
	'vorbis': aud,
	'vnd.rn-realaudio': aud,
	'vnd.wave': aud,
	'webm': aud,
	'cmd': tx,
	'css': tx,
	'csv': tx,
	'html': tx,
	'plain': tx,
	'rtf': tx,
	'vcard': tx,
	'vnd.abc': tx,
	'xml': tx,
	'gif': img,
	'jpeg': img,
	'pjpeg': img,
	'png': img,
	'svg+xml': img,
	'vnd.djvu': img,
	'avi': vd,
	'mpeg': vd,
	'mp4': vd,
	'quicktime': vd,
	'x-matroska': vd,
	'x-ms-wmv': vd,
	'x-flv': vd
};

module.exports.get = function __httpMimeGet(fileType) {
	// mime type exception handler
	fileType = checkTypeException(fileType);
	const prefix = map[fileType] || null;
	if (!prefix) {
		return '';
	}
	return prefix + fileType;
};

module.exports.getFromPath = function __httpMimeGetFromPath(path) {
	const ext = path.substring(path.lastIndexOf('.') + 1);
	return module.exports.get(ext);
};

module.exports.is = function __httpMimeIs(headers, fileType) {
	if (headers && headers['content-type']) {
		if (headers['content-type'].indexOf(fileType) !== -1) {
			return true;
		}
	}
	return false;
};

function checkTypeException(type) {
	switch (type) {
		case 'jpg':
			return 'jpeg';
		default:
			return type;
	}
}

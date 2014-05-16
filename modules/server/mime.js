var app = 'application/';
var aud = 'audio/';
var tx = 'text/';
var map = {
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
	'mp4': aud,
	'mpeg': aud,
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
	'xml': tx
};

module.exports = function (fileType) {
	var prefix = map[fileType] || null;
	if (!prefix) {
		return '';
	}
	return prefix + fileType;
};

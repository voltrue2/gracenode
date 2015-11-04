var gn = require('gracenode');
var logger = gn.log.create();

exports.GET = function (req, res) {
	logger.debug('controller:', req.controller);
	logger.debug('method:', req.method);
	res.json({ key: req.get('key'), method: 'sub2/foo', params: req.parameters });
};

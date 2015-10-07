exports.GET = function (req, res) {
	res.header('Cache-Control', 'private, max-age=6000');
	res.header('Pragma', null);
	res.header('Vary', 'foo');
	res.header('Connection', 'close');
	res.json('hello');
};

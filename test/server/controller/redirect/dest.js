exports.GET = function (req, res) {
	if (res.header) {
		res.header('url', req.url);
	} else {
		res.headers.url = req.url;
	}
	res.json('here');
};

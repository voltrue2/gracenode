module.exports.GET = function (req, res) {
	res.json({ state: 'ok' });
	res.error(new Error('test error'));
};

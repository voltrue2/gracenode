module.exports.params = ['one'];

module.exports.GET = function (req, res) {
	var id = req.data('id');
	var paramOne = req.getParam('one');
	res.json('land/here' + (id || '') + (paramOne || ''));
};

exports.expected = {
	id: function (value) {
		if (typeof value !== 'number') {
			return new Error('id must be a number');
		}
	},
	name: function (value) {
		if (typeof value !== 'string') {
			return new Error('name must be a string');
		}
	}
};

exports.GET = function (req, res) {
	res.json('ok');
};

var fs = require('fs');

exports.PUT = function (req, res) {
	var now = Date.now();
	var path = '/tmp/sample.' + now;
	var newPath = '/tmp/sample2.' + now;
	fs.writeFile(path, 'Hello World', function (error) {
		if (error) {
			return res.error(error, 500);
		}
		req.moveUploadedFile(path, newPath, function (error) {
			if (error) {
				return res.error(error, 500);
			}
			req.getUploadedFileData(newPath, function (error, data) {
				if (error) {
					return res.error(error, 500);
				}
				res.json({ data: data });
			});
		});
	});
};

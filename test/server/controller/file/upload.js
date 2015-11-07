var fs = require('fs');

exports.PUT = function (req, res) {
	var now = Date.now();
	var path = '/tmp/sample.' + now;
	var newPath = '/tmp/sample2.' + now;
	fs.writeFile(path, 'Hello World', function (error) {
		if (error) {
			return res.error(error, 500);
		}
		var mv = req.moveUploadedFile || fs.rename;
		mv(path, newPath, function (error) {
			if (error) {
				return res.error(error, 500);
			}
			var read = req.getUploadedFileData || fs.readFile;
			read(newPath, function (error, data) {
				if (error) {
					return res.error(error, 500);
				}
				data = data.toString();
				res.json({ data: data });
			});
		});
	});
};

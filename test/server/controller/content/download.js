var fs = require('fs');
exports.GET = function (req, res) {
	var data = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAG1BMVEX////CQzfCQzfCQzfCQzfCQzfCQzfCQzfCQze4cTvvAAAACHRSTlMAM0Rmd4iqzHMjLxwAAAAuSURBVAhbY2DABhiVoIyMjgIwzdzC0gxmsDYwtOJgRHR0dASAGEC6o4FYBhoAAMUeFRBHLNC5AAAAAElFTkSuQmCC';
	var filename = 'dummy.png';
	if (req.args) {
		fs.writeFile('/tmp/dummy.png', data, function (error) {
			if (error) {
				return res.error(error, 500);
			}
			res.download('/tmp/dummy.png');
		});
		return;		
	}
	res.download(data, filename);
};

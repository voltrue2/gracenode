module.exports = function () {
	var d = new Date();
	return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
};

function pad(n) {
	if (n < 10) {
		return '0' + n;
	}
	return n;
}

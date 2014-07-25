module.exports.COLORS = {
	RED: '0;31',
	LIGHT_BLUE: '1;36',
	DARK_BLUE: '1;34',
	GRAY: '0;37',
	BROWN: '0;33',
	PURPLE: '1;35',
	GREEN: '0;32'	
};

module.exports.color = function (str, colorCode) {
	return '\033[' + colorCode + 'm' + str + '\033[0m';
};
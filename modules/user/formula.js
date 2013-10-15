var funcs = {};

module.exports.calc = function (lv, prop) {
	var funcName = prop.growth || null;
	if (!funcName || !funcs[funcName]) {
		return prop.initVal;
	}
	return funcs[funcName](lv, prop.initVal);
};

funcs.simple = function (lv, initVal) {
	var magicNum = 10;
	var val = initVal + (magicNum * lv); 
	return val;
};

funcs.every2Lv = function (lv, initVal) {
	var val = Math.floor(lv / 2);
	return initVal + val;
};

funcs.every3Lv = function (lv, initVal) {
	var val = Math.floor(lv / 3);
	return initVal + val;
};

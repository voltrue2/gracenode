
var config;
var gachaPackages = {};

exports.readConfig = function (configIn) {
	config = configIn;
};

exports.loadResource = function (gachaName, sourceData, ratioColumnName) {
	gachaPackages[gachaName] = {
		data: sourceData,
		ratioName: ratioColumnName
	};
};

// absoulte ratio
exports.exec = function (gachaName) {
	var gacha = gachaPackages[gachaName] || null;
	if (!gacha) {
		return new Error('invalid gacha name: ' + gachaName);
	}
	var data = gacha.data;
	var ratio = gacha.ratioName;
	var max = 0;
	for (var i = 0, len = data.length; i < len; i++) {
		max += Number(data[i][ratio]);	
	}
};

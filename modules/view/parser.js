/*
* variable replacement syntax: (:= variable name:), (:include file path:)
*/
var gracenode = require('../../');
var log = gracenode.log.create('view/parser');

module.exports.create = function (valueMap) {
	return new Parser(valueMap);
};

function Parser(valueMap) {
	this._valueMap = valueMap || null;
}

Parser.prototype.parseData = function (data) {
	var includeList = [];
	data = this.parse(data, function (that, tag, keyTag, indicator, data) {
		// evaluate the indicator
		switch (indicator) {
			case '=':
				data = that.replace(that, tag, keyTag, indicator, data);
				break;
			case 'include':
				includeList.push({ tag: tag, path: keyTag });
				break;
			default:
				log.warning('unkown indicator found: [' + indicator + '] ' + tag);
				break;
		}
		return data;
	});
	return {
		includeList: includeList,
		data: data
	};
};

// functions below are not meant to be used outside of this file

Parser.prototype.parse = function (data, callbackEach) {
	var pattern = /\(:([^:\)]+)?:\)/g;	
	var match = pattern.exec(data);
	while (match) {
		var tag = match[0];
		var indicator = tag.substring(2, tag.indexOf(' '));
		var keyTag = tag.substring(2 + indicator.length, tag.length - 2).trim(' ');
		data = callbackEach(this, tag, keyTag, indicator, data);
		match = pattern.exec(data);
	}
	return data;
};

Parser.prototype.replace = function (that, tag, keyTag, indicator, data) {
	var keys = keyTag.split('.');
	if (that._valueMap[keys[0]] !== undefined) {
		var value = that._valueMap[keys[0]];
		if (typeof value === 'object') {
			for (var i = 0, len = keys.length; i < len; i++) {
				if (value[keys[i]] !== undefined) {
					value = value[keys[i]];
				}
			}
		}
		return data.replace(tag, value);
	}
	log.warning('no value found for tag "' + tag + '"');
	return data;
};

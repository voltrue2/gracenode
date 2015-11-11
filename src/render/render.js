'use strict';

var loader = require('./loader');

var COND_TAG = /{{(.*?)}}/;
//var VAR_TAG = /{(.*?)}/g;
var VAR_TAG = /({{(.*?)}}|{(.*?)})/g;
var LOGIC_TYPES = [
	'if',
	'for',
	'require'
];

/*
 if syntax
{{ if (conditions)
	<html here>
endif }}
*/

/*
 for syntax
{{ for (conditions)
	<html here>
endfor }}
*/

exports.prerender = function (content) {
	// remove line breaks and tabs
	content = content.replace(/(\n|\r|\t)/g, '');
	return extract(content);
};

exports.render = function (path, vars) {
	if (!vars) {
		vars = {};
	}
	var loaded = loader.getLoadedByPath(path);
	if (!loaded) {
		throw new Error('Pre-renderedNotFound: ' + path);
	}
	var content = loaded.source;
	var tags = loaded.tags;
	var varTags = loaded.vars;
	// apply logics
	content = applyLogics(content, tags, vars, varTags);
	// apply vars (logics must be applied first)
	content = applyVars(content, vars, varTags);
	return content;
};

function extract(content) {
	var tmp = content;
	var matched = content.match(COND_TAG);
	var index = 0;
	var list = [];
	var vars = {};

	if (!matched) {
		return { list: [], vars: null };
	}

	while (matched) {
		var tag = matched[0];
		tmp = tmp.replace(tag, '');
		// remove open and close {{ and }}
		tag = tag.substring(2, tag.length - 2);
		var logic = extractLogic(tag);
		if (!logic) {
			// no logic means the tag is a variable
			vars = extractVars(vars, '{{' + tag + '}}');
		} else {
			vars = extractVars(vars, tag);
			list.push({
				tag: '{{' + tag + '}}',
				logic: logic
			});
		}
		index += 1;
		// next
		matched = tmp.match(COND_TAG); 
	}
	return { content: content, list: list, vars: vars };
}

function extractLogic(tag) {
	var logic = null;
	var conditions = null;
	tag = tag.replace(/\ /g, '');
	for (var i = 0, len = LOGIC_TYPES.length; i < len; i++) {
		if (tag.toLowerCase().indexOf(LOGIC_TYPES[i]) === 0) {
			logic = LOGIC_TYPES[i];
			conditions = extractLogicConditions(logic, tag);
			break;
		}
	}
	if (!logic && !conditions) {
		return null;
	}
	return {
		logic: logic,
		conditions: conditions
	};
}

function extractLogicConditions(logic, tag) {
	switch (logic) {
		case 'if':
			return getIfConditions(tag);		
		case 'for':		
			return getForConditions(tag);
		case 'require':
			return getRequireConditions(tag);
		default:
			throw new Error('InvalidLogic: ' + logic + '\n' + tag);
	}
}

function getIfConditions(tag) {
	var res = {};
	var tmp;
	var index = 0;
	// look for if
	var openIndex = tag.indexOf('if(');
	var closeIndex = tag.indexOf('):');
	res['if'] = {
		conditions: tag.substring(openIndex + 3, closeIndex).split(/(\&\&|\|\|)/g),
		result: tag.substring(closeIndex + 2, tag.search(/(elseif\(|else|endif)/))
	};
	// look for else if
	tag = tag.substring(tag.indexOf(res['if'].result) + res['if'].result.length, tag.length);
	openIndex = tag.indexOf('elseif(');
	while (openIndex !== -1) {
		if (!res.elseif) {
			res.elseif = [];
		}
		closeIndex = tag.indexOf('):');
		var cond = tag.substring(openIndex + 7, closeIndex).split(/(\&\&|\|\|)/g);
		tag = tag.replace('elseif', '');
		closeIndex = tag.indexOf('):');
		res.elseif[index] = {
			conditions: cond,
			result: tag.substring(closeIndex + 2, tag.search(/(elseif\(|else|endif)/)) 
		};
		tmp = tag.substring(tag.indexOf(res.elseif[index].result) + res.elseif[index].result.length);
		if (tmp === tag) {
			throw new Error(
				'InvalidIfConditions: ' + tag +
				'\nconditions: ' + res.elseif[index].conditions +
				'\nresult: ' + res.elseif[index].result
			);
		}
		tag = tmp;
		index += 1;
		openIndex = tag.indexOf('elseif(');
	}
	// look for else
	openIndex = tag.indexOf('else:');
	closeIndex = tag.lastIndexOf('endif');
	if (openIndex !== -1) {
		res['else'] = {
			conditions: null,
			result: tag.substring(openIndex + 5, closeIndex)
		};
	}
	return res;
}

function getForConditions(tag) {
	var open = 'for(';
	var closeIndex = tag.lastIndexOf('):');
	var conditions = tag.substring(tag.indexOf(open) + open.length, closeIndex).split(';');
	var iterate = tag.substring(closeIndex + 2, tag.lastIndexOf('endfor'));
	return {
		conditions: conditions,
		iterate: iterate
	};
}

function getRequireConditions(tag) {
	var open = 'require(';
	return tag.substring(tag.indexOf(open) + open.length, tag.lastIndexOf(')'));
}

function extractVars(vars, tag) {
	var found = tag.match(VAR_TAG);
	if (found) {
		// remove open and close { and } + spaces
		for (var i = 0, len = found.length; i < len; i++) {
			if (!vars[found[i]]) {
				// for {{variable}}, remove { and }
				var v = found[i].substring(1, found[i].length - 1).replace(/\ /g, '').replace(/({|})/g, '');
				vars[found[i]] = v;
			}
		}
	}
	return vars;
}

function applyVars(content, vars, varTags) {
	for (var varTag in varTags) {
		var varName = varTag.replace(/\ /g, '').replace(/({|})/g, '');
		var value;
		if (varName.indexOf('.') !== -1) {
			// variable must be either an array or an object
			var sep = varName.split('.');
			value = vars[sep[0]];
			for (var i = 1, len = sep.length; i < len; i++) {
				if (value && value[sep[i]] !== undefined) {
					value = value[sep[i]];
				}
			}
			if (typeof value === 'object') {
				value = JSON.stringify(value);
			}
		} else {
			value = vars[varName];
		}
		if (value === undefined) {
			// there is no value
			continue;
		}
		content = content.replace(new RegExp(varTag, 'g'), value);
	}
	return content;
}

function applyLogics(content, tags, vars, varTags) {
	if (!tags) {
		// no logic to apply
		return content;
	}
	for (var i = 0, len = tags.length; i < len; i++) {
		var item = tags[i];
		var tag = item.tag;
		var logic = item.logic.logic;
		var conditions = item.logic.conditions;
		switch (logic) {
			case 'require':
				content = handleRequire(content, tag, conditions, vars, varTags);		
				break;
			case 'if':
				content = handleIf(content, tag, conditions, vars);
				break;
			case 'for':
				content = handleFor(content, tag, conditions, vars, varTags);
				break;
			default:
				break;
		}
	}
	return content;
}

function handleRequire(content, tag, conditions, vars, varTags) {
	// apply variables
	conditions = applyVars(conditions, vars, varTags);
	var required = exports.render(conditions, vars);
	if (!required) {
		throw new Error('RequireFailed: ' + conditions);
	}
	// add required
	return content.replace(tag, required);
}

function handleIf(content, tag, conditions, vars) {
	for (var action in conditions) {
		var andOr;
		var pass = false;
		// evaluate multiple or single else if
		if (action === 'elseif') {
			var elseifList = conditions[action];
			for (var j = 0, jen = elseifList.length; j < jen; j++) {
				var dataList = elseifList[j].conditions;
				for (var k = 0, ken = dataList.length; k < ken; k++) {
					if (dataList[k] !== '&&' && dataList[k] !== '||') {
						var con = dataList[k].split(/(===|!==|==|!=|>=|<=|>|<)/);
						var val11 = vars[con[0]] === undefined ? vars[con[0]] : con[0];
						var val22 = vars[con[2]] === undefined ? vars[con[2]] : con[2];
						switch (con[1]) {
							case '===':
							case '==':
								pass = val11 === val22;
								break;
							case '!==':
							case '!=':
								pass = val11 !== val22;
								break;
							case '>=':
								pass = val1 >= val2;
								break;
							case '<=':
								pass = val1 <= val2;
								break;
							case '>':
								pass = val1 > val2;
								break;
							case '<':
								pass = val1 < val2;
								break;
							default:
								throw new Error('InvalidIfConditions: ' + JSON.stringify(dataList[k]));
						}
						pass = (!pass && andOr === '||' && prevPass) ? true : true;
					}
				}
				// one of the else-ifs was true
				if (pass) {
					content = content.replace(tag, elseifList[j].result);
					break;
				}
			}
			if (pass) {
				break;
			} else {
				continue;
			}
		}
		var list = conditions[action].conditions;
	
		// else	
		if (!list && action === 'else') {
			content = content.replace(tag, conditions[action].result);	
			break;
		}	

		// evaluate if conditions
		for (var i = 0, len = list.length; i < len; i++) {
			if (list[i] !== '&&' && list[i] !== '||') {
				var prevPass = pass;
				var cond = list[i].split(/(===|!==|==|!=|>=|<=|>|<)/);		
				var val1 = vars[cond[0]] === undefined ? vars[cond[0]] : cond[0];
				var val2 = vars[cond[2]] === undefined ? vars[cond[2]] : cond[2];
				switch (cond[1]) {
					case '===':
					case '==':
						pass = val1 === val2;
						break;
					case '!==':
					case '!=':
						pass = val1 !== val2;
						break;
					case '>=':
						pass = val1 >= val2;
						break;
					case '<=':
						pass = val1 <= val2;
						break;
					case '>':
						pass = val1 > val2;
						break;
					case '<':
						pass = val1 < val2;
						break;
					default:

						console.log(cond);

						throw new Error('InvalidIfConditions: ' + JSON.stringify(list[i]));
				}
				if (andOr && andOr === '||' && prevPass) {
					pass = true;
				}
			} else {
				andOr = list[i];
			}
		}

		// if was true		
		if (pass) {
			content = content.replace(tag, conditions[action].result);
			break;
		}
	}

	return content;
}

function handleFor(content, tag, conditions, vars, varTags) {
	// apply variables to all conditions
	for (var i = 0, len = conditions.conditions.length; i < len; i++) {
		conditions[i] = applyVars(conditions.conditions[i], vars, varTags);
	}
	// evaluate the conditions for loop
	var startData = conditions[0].split('=');
	var startVar = startData[0];
	var start = parseFloat(startData[1]);
	var max = conditions[1].split(/(<\=|>\=|<|>)/);
	var maxOp = max[1];
	var maxVal = parseFloat(max[2]);
	// ++, --, +=, -= as a string
	var changes = conditions[2].split(/(\+\+|\-\-|\+\=|\-\=)/);
	var changeOp = changes[1];
	var changeVal;
	if (changes[2] !== '' && !isNaN(changes[2])) {
		changeVal = parseFloat(changes[2]);
	} else {
		changeVal = 1;
	}
	// iterate
	var iterateContent = conditions.iterate;
	var loop = true;
	var iterated = '';
	var replacer = function (str) {
		var replaced = str.replace('.' + startVar, '.' + start);
		varTags[replaced] = replaced.replace(/({|})/g, '');
		return replaced;
	};
	while (loop) {
		// iteration operation
		var iteVars = {};
		var iteVarTags = {};
		iteVars[startVar] = start;
		iteVarTags['{' + startVar + '}'] = startVar;
		var ite = applyVars(iterateContent, iteVars, iteVarTags);
		ite = ite.replace(new RegExp('{(.*?).' + startVar + '}', 'g'), replacer);
		// apply variables
		iterated += applyVars(ite, vars, varTags);
		// move the loop
		if (changeOp === '++' || changeOp === '+=') {
			start += changeVal;
		} else if (changeOp === '--' || changeOp === '-=') {
			start -= changeVal;
		} else {
			throw new Error('InvalidLoop: ' + start + ' ' + changeOp + ' ' + changeVal);
		}
		// loop stop evaluation	
		if (maxOp === '<') {
			loop = start < maxVal;
		} else if (maxOp === '>') {
			loop = start > maxVal;
		} else if (maxOp === '<=') {
			loop = start <= maxVal;
		} else if (maxOp === '>=') {
			loop = start >= maxVal;
		} else {
			throw new Error('InvalidLoop: ' + start + ' ' + maxOp + ' ' + maxVal);
		}
	}
	// apply the iterated result
	content = content.replace(tag, iterated);
	return content;
}

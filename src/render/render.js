'use strict';

var loader = require('./loader');

var COND_TAG = /{{(.*?)}}/;
var VAR_TAG = /({{(.*?)}}|{(.*?)})/g;
var LOGICS = {
	IF: 'if',
	FOR: 'for',
	FOREACH: 'foreach',
	REQ: 'require'
};
var LOGIC_TYPES = [
	LOGICS.IF,
	LOGICS.FOREACH,
	LOGICS.FOR,
	LOGICS.REQ
];
var LB = '(_n_)';
var LBR = /\(_n_\)/g;
var TB = '(_t_)';
var TBR = /\(_t_\)/g;
var ALLR = /(\ |\(_n_\)|\(_t_\))/g;

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
	content = content.replace(/(\n|\r)/g, LB);
	content = content.replace(/(\t)/g, TB);
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
	// embed variables as javascript object
	var js = '<script type="text/javascript">' +
		'window.gracenode=' + JSON.stringify(vars) + ';</script>';
	content = content.replace('</head>', js + '\n</head>');
	// bring back line breaks and tabs
	content = content.replace(LBR, '\n');
	content = content.replace(TBR, '\t');

	return content;
};

function extract(content) {
	var tmp = content;
	var matched = content.match(COND_TAG);
	var index = 0;
	var list = [];
	var vars = {};

	if (!matched) {
		return { content: content, list: [], vars: null };
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
	tag = tag.replace(ALLR, '');
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
		case LOGICS.IF:
			return getIfConditions(tag);		
		case LOGICS.FOR:		
			return getForConditions(tag);
		case LOGICS.FOREACH:
			return getForEachConditions(tag);
		case LOGICS.REQ:
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
	var openIndex = tag.indexOf(LOGICS.ID + '(');
	var closeIndex = tag.indexOf('):');
	res[LOGICS.IF] = {
		conditions: tag.substring(openIndex + 3, closeIndex).split(/(\&\&|\|\|)/g),
		result: tag.substring(closeIndex + 2, tag.search(/(elseif\(|else|endif)/))
	};
	// look for else if
	tag = tag.substring(tag.indexOf(res[LOGICS.IF].result) + res[LOGICS.IF].result.length, tag.length);
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
	closeIndex = tag.lastIndexOf('end' + LOGICS.IF);
	if (openIndex !== -1) {
		res['else'] = {
			conditions: null,
			result: tag.substring(openIndex + 5, closeIndex)
		};
	}
	return res;
}

function getForConditions(tag) {
	var open = LOGICS.FOR + '(';
	var closeIndex = tag.lastIndexOf('):');
	var conditions = tag.substring(tag.indexOf(open) + open.length, closeIndex).split(';');
	var iterate = tag.substring(closeIndex + 2, tag.lastIndexOf('end' + LOGICS.FOR));
	return {
		conditions: conditions,
		iterate: iterate
	};
}

function getForEachConditions(tag) {
	var openIndex = tag.indexOf(LOGICS.FOREACH + '(') + LOGICS.FOREACH.length + 1;
	var closeIndex = tag.lastIndexOf('):');
	var condition = tag.substring(openIndex, closeIndex).replace(/({|})/g, '');
	var iterate = tag.substring(closeIndex + 2, tag.indexOf('end' + LOGICS.FOREACH));
	return {
		condition: condition,
		iterate: iterate
	};
}

function getRequireConditions(tag) {
	var open = LOGICS.REQ + '(';
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
			case LOGICS.REQ:
				content = handleRequire(content, tag, conditions, vars, varTags);		
				break;
			case LOGICS.IF:
				content = handleIf(content, tag, conditions, vars);
				break;
			case LOGICS.FOR:
				content = handleFor(content, tag, conditions, vars, varTags);
				break;
			case LOGICS.FOREACH:
				content = handleForEach(content, tag, conditions, vars, varTags);
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
		var pass = false;
		// evaluate multiple or single else if
		if (action === 'elseif') {
			var elseifList = conditions[action];
			for (var j = 0, jen = elseifList.length; j < jen; j++) {
				var dataList = elseifList[j].conditions;
				pass = evalIf(dataList, vars);
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
		pass = evalIf(list, vars);

		// if was true		
		if (pass) {
			content = content.replace(tag, conditions[action].result);
			break;
		}
	}

	return content;
}

function evalIf(list, vars) {
	var andOr;
	var pass = false;
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
					throw new Error('InvalidIfConditions: ' + JSON.stringify(list[i]));
			}
			if (andOr && andOr === '||' && prevPass) {
				pass = true;
			}
		} else {
			andOr = list[i];
		}
	}
	return pass;
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
		ite = ite.replace(new RegExp('{(.*?).' + startVar + '(.*?)}', 'g'), replacer);
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

function handleForEach(content, tag, data, vars, varTags) {
	var objName = data.condition;
	var obj = vars[objName];
	if (!obj) {
		return content;
	}
	var iterated = '';
	var replacer = function (str) {
		var replaced = str.replace('.key', '.' + key);
		varTags[replaced] = replaced.replace(/({|})/g, '');
		return replaced;
	};
	var key;
	for (key in obj) {
		var reg = new RegExp('{' + objName + '.key(.*?)}', 'g');
		var ite = data.iterate.replace(reg, replacer);
		iterated += applyVars(ite, vars, varTags);
	}
	content = content.replace(tag, iterated);
	return content;
}

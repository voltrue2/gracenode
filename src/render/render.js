'use strict';

var loader = require('./loader');
var func = require('./func');

var FUNC_OPEN_TAG = /\(/g;
var FUNC_CLOSE_TAG = /\)/g;
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
var LITG = /{{literal(.*?)literal}}/g;
var LIT = /{{literal(.*?)literal}}/;
var LIT_TAG = '{{littag}}';
var LB = '(_n_)';
var LBR = /\(_n_\)/g;
var TB = '(_t_)';
var TBR = /\(_t_\)/g;
var ALLR = /(\ |\(_n_\)|\(_t_\))/g;
var RNT = /(\(_n_\)|\(_t_\))/g;

var REG = {
	LB: /(\n|\r)/g,
	TB: /\t/g,
	IFC: /(\&\&|\|\|)/g,
	IFE: /(===|!==|==|!=|>=|<=|>|<)/,
	IFV: /({|})/g,
	IFS: /(elseif\(|else|endif)/,	
	FORE: /(<\=|>\=|<|>)/,
	FORI: /(\+\+|\-\-|\+\=|\-\=)/,
	FOREACH: /in{/,	
	VARS: /\ /g
};

var varMap = {};

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

exports.getAllPaths = function __renderGetAllPaths() {
	return loader.getAllPaths();
};

exports.prerender = function __renderPrerender(content) {
	// remove line breaks and tabs
	content = content.replace(REG.LB, LB);
	content = content.replace(REG.TB, TB);
	return extract(content);
};

exports.render = function __renderRender(path, vars) {
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
		'window.gracenode=' + JSON.stringify(vars) +
		';' + loader.getClient() + '</script>';
	content = content.replace('</head>', js + '\n</head>');
	// restore literals
	for (var i = 0, len = loaded.literals.length; i < len; i++) {
		content = content.replace(LIT_TAG, loaded.literals[i]);
	}
	// bring back line breaks and tabs
	content = content.replace(LBR, '\n');
	content = content.replace(TBR, '\t');
	// done
	return content;
};

function extract(content) {
	var matched = content.match(COND_TAG);

	if (!matched) {
		return { content: content, list: [], vars: null, literals: [] };
	}
	
	var list = [];
	var vars = {};
	
	// extract literals
	var literals = content.match(LITG) || [];
	// remove literals
	content = content.replace(LITG, LIT_TAG);
	// format literal list
	for (var i = 0, len = literals.length; i < len; i++) {
		var match = literals[i].match(LIT);
		var litVal = match[1];
		literals[i] = litVal;
	}
	
	var tmp = content;

	// extract the rest of the logics
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
		// next
		matched = tmp.match(COND_TAG); 
	}

	//done
	return { content: content, list: list, vars: vars, literals: literals };
}

function extractLogic(tag) {
	var logic = null;
	var conditions = null;
	var stag = tag.replace(RNT, '');
	tag = tag.replace(ALLR, '');
	for (var i = 0, len = LOGIC_TYPES.length; i < len; i++) {
		if (tag.toLowerCase().indexOf(LOGIC_TYPES[i]) === 0) {
			logic = LOGIC_TYPES[i];
			conditions = extractLogicConditions(logic, tag, stag);
			break;
		}
	}
	if (!logic && !conditions) {
		return null;
	}
	// if, for, foreach must have conditions
	if (logic !== LOGIC_TYPES.REQ && !conditions) {
		return null;
	}
	return {
		logic: logic,
		conditions: conditions
	};
}

function extractLogicConditions(logic, tag, stag) {
	switch (logic) {
		case LOGICS.IF:
			return getIfConditions(tag, stag);		
		case LOGICS.FOR:		
			return getForConditions(stag);
		case LOGICS.FOREACH:
			return getForEachConditions(stag);
		case LOGICS.REQ:
			return getRequireConditions(tag);
		default:
			throw new Error('InvalidLogic: ' + logic + '\n' + tag);
	}
}

function getIfConditions(tag, stag) {
	/******* New Logic Here *******/
	// extract if conditions and its result
	var map = {};
	var oIndex = stag.indexOf('(');
	var cIndex = stag.indexOf('):');

	if (stag.replace(REG.VARS, '').indexOf(LOGICS.IF + '(') === -1) {
		//throw new Error('InvalidOpen: ' + stag);
		return null;
	}
	
	if (cIndex === -1) {
		//throw new Error('InvalidClose: ' + stag);
		return null;
	}

	// extract if
	var ext = stag.substring(oIndex + 1, cIndex);
	var list = parseIfConds(ext.split(REG.IFC));
	
	if (!list) {
		return null;
	}

	var result = stag.substring(cIndex + 2, stag.search(REG.IFS));
	map[LOGICS.IF] = {
		conditions: list,
		result: result
	};
	// remove if from stag
	var tmp = stag.substring(stag.indexOf(result) + result.length);
	// extract else if
	var elseIf = stag.replace(REG.VARS, '').indexOf('elseif(');
	while (elseIf !== -1) {	
		oIndex = tmp.indexOf('(');
		cIndex = tmp.indexOf('):');
		if (cIndex === -1) {
			//throw new Error('InvalidClose: ' + stag);
			continue;
		}
		ext = tmp.substring(oIndex + 1, cIndex);
		list = parseIfConds(ext.split(REG.IFC));

		if (!list) {
			continue;
		}

		tmp = tmp.substring(cIndex + 2);
		result = tmp.substring(0, tmp.search(REG.IFS));
		if (!map.elseif) {
			map.elseif = [];
		}
		map.elseif.push({
			conditions: list,
			result: result
		});
		tmp = tmp.substring(tmp.indexOf(result) + result.length);
		elseIf = tmp.replace(REG.VARS, '').indexOf('elseif(');
	}
	// extract else
	oIndex = tmp.indexOf('else:');
	
	if (oIndex !== -1) {
		cIndex = tmp.indexOf('end' + LOGICS.IF);

		if (cIndex === -1) {
			//throw new Error('InvalidClose: ' + stag);
			return null;
		}

		map.else = {
			conditions: null,
			result: tmp.substring(oIndex + 5, cIndex)
		};
	}	

	return map;
}

function parseIfConds(list) {
	for (var i = 0, len = list.length; i < len; i++) {
		if (list[i] !== '&&' && list[i] !== '||') {
			var cond = list[i].split(REG.IFE);
			if (cond.length !== 3) {
				/*
				throw new Error(
					'InvalidIfConditions: ' + list[i] +
					'\nformat must be variable1 === variable etc'
				);
				*/
				return null;
			}	
			list[i] = {
				op: cond[1],
				val1: cond[0].replace(REG.IFV, ''),
				val2: cond[2].replace(REG.IFV, '')
			};
		}
	}	
	return list;
}

function getForConditions(stag) {
	
	var indexes = getOpenCloseEnd(LOGICS.FOR, stag);

	if (!indexes) {
		return null;
	}

	var oIndex = indexes.open;
	var cIndex = indexes.close;
	var eIndex = indexes.end;

	var conditions = stag.substring(oIndex + 1, cIndex).replace(REG.VARS, '').split(';');
	var iterate = stag.substring(cIndex + 2, eIndex);

	var cond = {};
	var startData = conditions[0].split('=');
	var max = conditions[1].split(REG.FORE);
	var changes = conditions[2].split(REG.FORI);
	cond.var = startData[0];
	cond.start = startData[1];
	cond.maxOp = max[1];
	cond.maxVal = max[2];
	cond.changeOp = changes[1];
	cond.changeVal = changes[2];

	return {
		conditions: cond,
		iterate: iterate
	};
}

function getForEachConditions(stag) {
	var indexes = getOpenCloseEnd(LOGICS.FOREACH, stag);

	if (!indexes) {
		return null;
	}

	var oIndex = indexes.open;
	var cIndex = indexes.close;
	var eIndex = indexes.end;
	var sep = stag.substring(oIndex + 1, cIndex).replace(REG.VARS, '').split(REG.FOREACH);
	var key = sep[0];
	var obj = sep[1].replace('}', '');
	var iterate = stag.substring(cIndex + 2, eIndex);

	return {
		condition: {
			key: key,
			obj: obj
		},
		iterate: iterate
	};
}

function getOpenCloseEnd(type, stag) {
	var oIndex = stag.indexOf('(');
	var cIndex = stag.lastIndexOf('):');
	var eIndex = stag.lastIndexOf('end' + type);

	if (stag.replace(REG.VARS, '').indexOf(type + '(') === -1) {
		//throw new Error('InvalidOpen: ' + stag);
		return null;
	}

	if (cIndex === -1) {
		//throw new Error('InvalidClose: ' + stag);
		return null;
	}

	if (eIndex === -1) {
		//throw new Error('InvalidEnd: ' + stag);
		return null;
	}

	return {
		open: oIndex,
		close: cIndex,
		end: eIndex
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
			var key = found[i];
			if (!vars[key]) {
				try {
					// for {{variable}}, remove { and }
					vars[key] = key.replace(REG.VARS, '').replace(REG.IFV, '');
					varMap[key] = new RegExp(key, 'g');
				} catch (e) {
					continue;
				}
			}
		}
	}
	return vars;
}

function applyVars(content, vars, varTags) {
	for (var varTag in varTags) {
		var varName = varTags[varTag];
		var value;
		// find func if being used
		var funcUsed = func.getFunc(varName);
		if (funcUsed) {
			varTag = varTag.replace(FUNC_OPEN_TAG, '\\(').replace(FUNC_CLOSE_TAG, '\\)');
			varName = funcUsed.value;
		}
		if (varName.indexOf('.') !== -1) {
			// variable must be either an array or an object
			var sep = varName.split('.');
			value = vars[sep[0]];
			for (var i = 1, len = sep.length; i < len; i++) {
				if (value && value[sep[i]] !== undefined) {
					value = value[sep[i]];
				}
			}
			// execute function
			if (funcUsed) {
				value = funcUsed.func(value);
			}
			if (typeof value === 'object') {
				value = JSON.stringify(value);
			}
		} else {
			value = vars[varName];
			// execute function
			if (funcUsed) {
				value = funcUsed.func(value);
			}
		}
		if (value === undefined) {
			// there is no value
			continue;
		}

		if (typeof value === 'function') {
			value = value();
		}

		var replacer = varMap[varTag] || new RegExp(varTag, 'g');
		content = content.replace(replacer, value);
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
	var hit = false;
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
					hit = true;
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
			hit = true;
			break;
		}	

		// evaluate if conditions
		pass = evalIf(list, vars);
		// if was true		
		if (pass) {
			content = content.replace(tag, conditions[action].result);
			hit = true;
			break;
		}
	}

	// no conditions met > remove if entirely
	if (!hit) {
		content = content.replace(tag, '');
	}

	return content;
}

function evalIf(list, vars) {
	var andOr;
	var pass = false;
	for (var i = 0, len = list.length; i < len; i++) {
		if (list[i] !== '&&' && list[i] !== '||') {
			var prevPass = pass;
			var val1 = list[i].val1.replace(REG.VARS, '');
			var val2 = list[i].val2.replace(REG.VARS, '');
			val1 = cast(vars[val1] || val1);
			val2 = cast(vars[val2] || val2);
			switch (list[i].op) {
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

function cast(val) {
	if (val[0] === '\'' || val[0] === '"') {
		var len = val.length - 1;
		if (val[len] === '\'' || val[0] === '"') {
			// string
			return val;
		}
	}
	if (!isNaN(val)) {
		// numeric
		return parseFloat(val);
	}
	switch (val.toLowerCase()) {
		case 'true':
			return true;
		case 'false':
			return false;
		case 'null':
			return null;
		case 'undefined':
			return undefined;
		default:
			return val;
	}
}

function handleFor(content, tag, conditions, vars, varTags) {
	// apply variables to all conditions
	var cond = conditions.conditions;
	var startVar = cond.var;
	var start = parseFloat(cond.start);
	var maxOp = cond.maxOp;
	var maxVal = parseFloat(applyVars(cond.maxVal, vars, varTags));
	var changeOp = cond.changeOp;
	var changeVal = parseFloat(cond.changeVal);
	if (isNaN(changeVal)) {
		changeVal = 1;
	}
	// skip and remove the loop tag if invalid array is given
	if (!maxVal) {
		return content.replace(tag, '');
	}
	// iterate
	var iterateContent = conditions.iterate;
	var loop = true;
	var iterated = '';
	var replacer = function __renderHandleForReplacer(str) {
		var replaced = str.replace('.' + startVar, '.' + start);
		varTags[replaced] = replaced.replace(REG.VARS, '').replace(REG.IFV, '');
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
	var objName = data.condition.obj;
	var keyName = data.condition.key;
	var obj = vars[objName];
	if (!obj) {
		return content;
	}
	// if the object is empty skip and remove tag
	if (!Object.keys(obj).length) {
		return content.replace(tag, '');
	}
	var iterated = '';
	var replacer = function __renderHandleForEachReplacer(str) {
		var replaced = str.replace('.' + keyName, '.' + key);
		varTags[replaced] = replaced.replace(REG.VARS, '').replace(REG.IFV, '');
		return replaced;
	};
	var key;
	for (key in obj) {
		var reg = new RegExp('{' + objName + '.' + keyName + '(.*?)}', 'g');
		var ite = data.iterate.replace(reg, replacer);
		iterated += applyVars(ite, vars, varTags);
	}
	content = content.replace(tag, iterated);
	return content;
}

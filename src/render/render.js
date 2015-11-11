'use strict';

var COND_TAG = /{{(.*?)}}/;
//var VAR_TAG = /{(.*?)}/g;
var VAR_TAG = /({{(.*?)}}|{(.*?)})/g;
var ACTION_TYPES = [
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
	// remove line breaks
	content = content.replace(/(\n|\r)/g, '');
	return extract(content);
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
		var action = extractAction(tag);
		if (!action) {
			// no action means the tag is a variable
			vars = extractVars(vars, '{{' + tag + '}}');
		} else {
			vars = extractVars(vars, tag);
		}
		list.push({
			tag: '{{' + tag + '}}',
			action: action
		});
		index += 1;
		// next
		matched = tmp.match(COND_TAG); 
	}

	return { list: list, vars: vars };
}

function extractAction(tag) {
	var action = null;
	var conditions = null;
	tag = tag.replace(/\ /g, '');
	for (var i = 0, len = ACTION_TYPES.length; i < len; i++) {
		if (tag.toLowerCase().indexOf(ACTION_TYPES[i]) === 0) {
			action = ACTION_TYPES[i];
			conditions = extractActionConditions(action, tag);
			break;
		}
	}
	if (!action && !conditions) {
		return null;
	}
	return {
		action: action,
		conditions: conditions
	};
}

function extractActionConditions(action, tag) {
	switch (action) {
		case 'if':
			return getIfConditions(tag);		
		case 'for':		
			return getForConditions(tag);
		case 'require':
			return getRequireConditions(tag);
		default:
			throw new Error('InvalidAction: ' + action + '\n' + tag);
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

(function () {

	var TAGS = {
		SRC: 'data-gn-src',
		LOCAL: 'data-gn-local'		
	};

	var TAG_EXEC_MAP = {};
	TAG_EXEC_MAP[TAGS.SRC] = getRemoteData;
	TAG_EXEC_MAP[TAGS.LOCAL] = getLocalData;

	document.EventListener('DOMContentLoaded', parse, false);

	window.render = function (target) {
		parse(null, target);
	};

	function parse(event, target) {
		for (var key in TAGS) {
			finder(TAGS[key], target);
		}
	}

	function finder(tagName, target) {
		target = target || document;
		var list = target.querySelectorAll('[' + tagName + ']') || [];
		var exec = TAG_EXEC_MAP[tagName];
		for (var i = 0, len = list.length; i < len; i++) {
			exec(list[i], tagName);
		}
	}

	function getRemoteData(elm, path) {
		window.request(path, 'GET', {}, {}, function (error, data) {
			if (error) {
				console.log(path, error);
				return;
			}
			var dom = buildDOM(data);
			elm.appendChild(dom);
		});		
	}

	/* example: gracenode.myData */
	function getLocalData(elm, str) {
		var list = str.split('.');
		var data = window;
		for (var i = 0, len = list.length; i < len; i++) {
			data = data[list[i]];
		}
		if (!data || data === window) {
			console.error(str, 'InvalidLocalData');
		}
		var dom = buildDOM(data);
		elm.appendChild(dom);
	}

	function buildDOM(data) {
		switch (typeof data) {
			case 'object':
				if (Array.isArray(data)) {
					return buildList(data);
				}
				return buildTwoColumnTable(data);
			default:
				return buildText(data);
		}
	}

	function buildList(data) {
		var container;
		var i;
		var len;
		/* a list of map = table */
		if (typeof data[0] === 'object') {
			var row;
			var labels = [];
			container = document.createElement('table');
			container.className = 'list-table';
			/* table labels */
			row = document.createElement('tr');
			for (i = 0, len = data.length; i < len; i++) {
				for (var name in data[i]) {
					if (labels.indexOf(data[i][name]) !== -1) {
						continue;
					}
					var th = document.createElement('th');
					th.textContent = data[i][name];
					row.appendChild(th);
				}
			}
			container.appendChild(row);
			/* table rows */
			for (i = 0, len = data.length; i < len; i++) {
				row = document.createElement('tr');
				var td = document.createElement('td');
				content = buildDOM(data[i]);
				td.appendChild(td);
				row.appendChild(td);
				container.appendChild(row);
			}
			/* done */
			return container;
		}
		/* a list of text = list */
		container = document.createElement('ul');
		container.className = 'list-container';
		for (i = 0, len = data.length; i < len; i++) {
			var item = document.createElement('li');
			item.appendChild(buildDOM(data[i]));
			container.appendChild(item);
		}
		/* done */
		return container;
	}

	function buildTwoColumnTable(data) {
		var container = document.createElement('table');
		container.className = 'two-col-table';
		for (var name in data) {
			var row = document.createElement('tr');
			var label = document.createElement('th');
			label.textContent = name;
			row.appendChild(label);
			var value = document.createElement('td');
			value.appendChild(buildDOM(data[name]));
			row.appendChild(value);
		}
		return container;
	}

	function buildText(data) {
		var container = document.createElement('div');
		container.className = 'text' + (typeof data === 'number' ? ' number' : '');
		container.textContent = data;
		return container;
	}
}());

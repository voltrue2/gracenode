(function () {

	var INDENT = 10;

	function DataObject(json) {
		if (typeof json === 'string') {
			json = JSON.parse(json);
		}
		this._json = json;
		this._edit = false;
	}

	DataObject.prototype.editMode = function (enable) {

	};

	DataObject.prototype.toDOM = function () {
		var container = document.createElement('div');
		this._parseToDOM(container, 'data', this._json, null, 0);
		return container;
	};

	DataObject.prototype.toJSON = function () {
		return this._json;
	};

	DataObject.prototype.stringify = function () {
		return JSON.stringify(this._json);
	};

	DataObject.prototype._parseToDOM = function (parentDOM, keyName, data, parentData, indent) {
		var me = document.createElement('div');
		me.className = 'data-object';
		me.style.textIndent = indent + 'px';
		parentDOM.appendChild(me);

		var name = document.createElement('span');
		name.textContent = keyName + ':';
		name.className = 'data-object-key';
		name.style.cursor = 'pointer';
		me.appendChild(name);

		var holder = document.createElement('div');
		holder.className = 'data-object-data';
		holder.style.display = 'none';
		me.appendChild(holder);

		name.addEventListener('click', function () {
			if (holder.style.display === 'none') {
				return holder.style.display = 'block';
			}
			holder.style.display = 'none';
		}, false);

		if (typeof data === 'object' && data !== null) {
			var keys = Object.keys(data);
			indent += INDENT;
			for (var i = 0, len = keys.length; i < len; i++) {
				this._parseToDOM(holder, keys[i], data[keys[i]], data, indent);	
			}
			return;
		}

		var that = this;
		var input = document.createElement('input');
		input.setAttribute('data-type', typeof data);
		input.setAttribute('type', 'text');
		input.value = data;
		input.className = 'data-object-value';
		holder.appendChild(input);
		input.addEventListener('change', function () {
			if (!parentData) {
				return;
			}
			var type = input.getAttribute('data-type');
			var value = input.value;
			if (type === 'number') {
				if (window.isNaN(input.value)) {
					// invalid data for number value
					return input.value = data;
				}
				if (input.value === '') {
					input.value = 0;
				}
				value = window.parseInt(input.value);
			}
			// update the source JSON object
			parentData[keyName] = typeCast(value);
		}, false);
	};

	function typeCast(value) {
		switch (value) {
			case 'null':
			case 'NULL':
			case 'Null':
				return null;
			case 'undefined':
			case 'UNDEFINED':
			case 'Undefined':
				return undefined;
			case 'true':
			case 'TRUE':
			case 'True':
				return true;
			case 'false':
			case 'FALSE':
			case 'False':
				return false;
			default:
				return value;
		}
	}

	window.DataObject = DataObject;

}());

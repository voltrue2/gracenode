/* dependency: EventEmitter */
(function () {

	function ObjectData(json) {
		window.EventEmitter.call(this);
		this._json = json;
		if (typeof this._json === 'string') {
			this._json = JSON.parse(this._json);
		}
	}

	window.inherits(ObjectData, window.EventEmitter);

	ObjectData.prototype.toDom = function (editMode) {
		var parent = document.createElement('div');
		parent.className = 'object-data';
		return this._parse(editMode, parent, this._json, null);
	};

	ObjectData.prototype.toJSON = function () {
		return this._json;
	};

	ObjectData.prototype._parse = function (editMode, parentElm, json, myKey) {
		var keys = Object.keys(json);
		var me = document.createElement('div');
		me.className = 'object-data-children';
		if (myKey) {
			me.className += ' ' + myKey;
		}
		parentElm.appendChild(me);
		for (var i = 0, len = keys.length; i < len; i++) {
			var key = keys[i];
			var data = json[key];
			var child = document.createElement('div');
			child.className = 'object-data-child ' + (typeof data);
			child.className += ' ' + key;
			if (typeof data === 'object') {
				child = this._parse(editMode, child, data, key);
			} else {
				this._setData(editMode, child, key, json);
			}
			me.appendChild(child);
		}
		return me;
	};

	ObjectData.prototype._setData = function (editMode, elm, key, parentObj) {
		var data = parentObj[key];
		if (!editMode) {
			return elm.textContent = data;
		}
		var input = document.createElement('input');
		var type = typeof data;
		switch (type) {
			case 'number':
				input.setAttribute('type', 'number');
				break;
			default:
				input.setAttribute('type', 'text');
				break;
		}
		input.setAttribute('value', data);
		elm.appendChild(input);
		var that = this;
		input.addEventListener('change', function () {
			// validate data value type
			if (type === 'number' && isNaN(input.value)) {
				// invalid data type for this data
				return input.value = parentObj[key];
			}
			// update the source JSON object
			parentObj[key] = input.value;
		});
	};

	window.ObjectData = ObjectData;

}());

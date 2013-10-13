/* dependencies: EventEmitter */
(function () {

var eventNameAlias = {};
var allowedEvents = null;
var buttonEvents = {
	'mousedown': '_tapstart',
	'mouseup': '_tapend',
	'mousemove': '_tapmove',
	'mouseover': '_over',
	'mouseuout': '_out'
};
var touchEventMap = {
	_tapstart: 'touchstart',
	_tapend: 'touchend',
	_tapmove: 'touchmove',
	_over: false, // will be ignored on touch device
	_out: false // will be ignored on touch device
};

function Dom(srcElm) {
	if (!srcElm) {
		srcElm = document.createElement('div');
	}
	EventEmitter.call(this);
	this._src = srcElm;
	this._src.__domObject = this;
	// event name alias
	this._eventNameAlias = eventNameAlias;
	// allowed events
	if (allowedEvents) {
		this.allowEvents(allowedEvents);
	}
	this.setStyle({ WebkitTapHighlightColor: 'rgba(0, 0, 0)' });
}

// static methods

Dom.query = query;
Dom.getById = getById;
Dom.setEventNameAlias = setEventNameAlias;
Dom.allowEvents = allowEvents;
Dom.create = create;
Dom.button = button;

function create(tagName) {
	var elm = document.createElement(tagName);
	return new Dom(elm);
}

function query(q, me) {
	var dom = me || document;
	var list = dom.querySelectorAll(q);
	var res = [];
	for (var i = 0, len = list.length; i < len; i++) {
		var item = null;
		if (list[i].__domObject) {
			item = list[i].__domObject;
		} else {
			item = new Dom(list[i]);
		}
		res.push(item);
	}
	return res;
}

function getById(id) {
	var elm = document.getElementById(id);
	if (elm) {
		if (elm.__domObject) {
			return elm.__domObject;
		}
		return new Dom(elm);
	}
	return null;
}

function button(dom) {
	dom.allowEvents(buttonEvents);
	var over = false;
	var start = null;
	var allowedMovement = 10;	
	dom.on(buttonEvents.mouseover, function (event) {
		if (!over) {
			this.emit('mouseover', event);
			over = true;
		}
	});
	dom.on(buttonEvents.mouseout, function (event) {
		if (over) {
			this.emit('mouseout', event);
			over = false;
		}
	});
	dom.on(buttonEvents.mousedown, function (event) {
		if (!start) {
			var touch = null;
			if (event.touches) {
				touch = event.touches[0] || { pageX: 0, pageY: 0 };
			} else {
				touch = { pageX: event.x || 0, pageY: event.y || 0 };
			}
			start = { x: touch.pageX, y: touch.pageY };
			this.emit('tapstart', event);
		}
	});
	
	dom.on(buttonEvents.mousemove, function (event) {
		if (start) {
			var touch = null;
			if (event.touches) {
				touch = event.touches[0] || { pageX: 0, pageY: 0 };
			} else {
				touch = { pageX: event.x || 0, pageY: event.y || 0 };
			}
			var x = touch.pageX;
			var y = touch.pageY;
			if (Math.abs(start.x - x) > allowedMovement || Math.abs(start.y - y) > allowedMovement) {
				this.emit('tapcancel', event);
				start = null;
			}
		}
	});
	
	dom.on(buttonEvents.mouseup, function (event) {
		if (start) {
			this.emit('tapend', event);
			start = null;
		}	
	});
}

/*
* alias { eventName: aliasForEvent } 
* Example: { mousedown: 'tapstart', touchstart: 'tapstart' } 
* dom.on('tapstart', function) will listen to both mousedown and touchstart
*/
function setEventNameAlias(alias) {
	eventNameAlias = alias;
}

function allowEvents(eventList) {
	allowedEvents = eventList;
}

window.inherits(Dom, EventEmitter);
window.Dom = Dom;

// public methods 

Dom.prototype.appendTo = function (parent) {
	var prevParent = this.getParent();
	if (prevParent) {
		this.remove();
	}
	if (parent instanceof Dom) {
		parent = parent._src;
	}
	parent.appendChild(this._src);	
};

Dom.prototype.query = function (queryStr) {
	return query(queryStr, this._src);
};

Dom.prototype.setStyle = function (styles) {
	for (var key in styles) {
		this._src.style[key] = styles[key];
	}
};

Dom.prototype.get = function (key) {
	return this._src[key];
};

Dom.prototype.set = function (key, value) {
	this._src[key] = value;
};

Dom.prototype.exec = function (funcName, callback) {
	var res = null;
	if (typeof this._src[funcName] === 'function') {
		res = this._src[funcName]();
	}
	if (typeof callback === 'function') {
		cb(null, res);
	}
};

Dom.prototype.getWidth = function () {
	return this._src.clientWidth || null;
};

Dom.prototype.getHeight = function () {
	return this._src.clientHeight || null;
};

Dom.prototype.setAttribute = function (attributes) {
	for (var key in attributes) {
		this._src.setAttribute(key, attributes[key]);
	}
};

Dom.prototype.getAttribute = function (keyList) {
	var list = {};
	for (var i = 0, len = keyList; i < len; i++) {
		list[keyList[i]] = this._src.getAttribute(keyList[i]);
	}
	return list;
};

Dom.prototype.getParent = function () {
	var parent = this._src.parentNode;
	if (!parent) {
		return null;
	}
	return parent.__domObject || new Dom(parent);
};

Dom.prototype.appendChild = function (childDom) {
	try {
		this._src.appendChild(childDom._src);
		this.emit('appendChild');
	} catch (exception) {
		console.error('Dom.appendChild', exception);
		console.error('this:', this._src, 'child:', childDom._src);
		console.trace();
		childDom = null;
	}
	return childDom;
};

Dom.prototype.createChild = function (domType, styles) {
	var src = document.createElement(domType);
	var childDom = new Dom(src);
	if (styles) {
		childDom.setStyle(styles);
	}
	this.appendChild(childDom);
	this.emit('createChild');
	return childDom;
};

Dom.prototype.removeChild = function (childDom) {
	try {
		this._src.removeChild(childDom._src);
		this.emit('removeChild');
	} catch (exception) {
		console.error('Dom.removeChild', exception);
		console.trace();
	}
};

Dom.prototype.removeAllChildren = function () {
	this._src.innerHTML = '';
};

Dom.prototype.remove = function () {
	try {
		this.getParent()._src.removeChild(this._src);
		this.emit('remove');	
	} catch (exception) {
		console.error('Dom.remove', exception);
		console.trace();
	}
};

/*
* eventMap { eventName: aliasForEvent } 
* Example: { mousedown: 'tapstart', touchstart: 'tapstart' } 
* dom.on('tapstart', function) will listen to both mousedown and touchstart
* this function detects availability of touch events automatically, if touch events are detected, the following events will be treated as:
* mousedown > touchstart, mouseup > touchend, mousemove > touchmove
*/
Dom.prototype.allowEvents = function (eventMap) {
	var that = this;
	var callback = function (event) {
		that.emit(that._eventNameAlias[event.type] || event.type, event);
	};
	// if an array is given force it to be an object
	if (Array.isArray(eventMap)) {
		var tmp = [];
		for (var i = 0, len = eventMap.length; i < len; i++) {
			tmp[eventMap[i]] = eventMap[i];
		}
		eventMap = tmp;
	}
	// auto detect touch events
	var canTouch = false;	
	if ('ontouchstart' in document.documentElement) {
		canTouch = true;
	}
	for (var eventName in eventMap) {
		var eventAlias = eventMap[eventName];
		if (canTouch && touchEventMap[eventAlias]) {
			eventName = touchEventMap[eventAlias];
		}
		that._eventNameAlias[eventName] = eventAlias;
		this._src.addEventListener(eventName, callback, false);
	}
};

Dom.prototype.setClassName = function (clsName) {
	this._src.className = clsName;
};

Dom.prototype.addClassName = function (clsName) {
	this._src.className = (this._src.className || '') + ' ' + clsName;
};

Dom.prototype.removeClassName = function (clsName) {
	var clsList = this._src.className.split(' ');
	var index = clsList.indexOf(clsName);
	if (index !== -1) {
		clsList.splice(index, 1);
	}
	this.setClassName(clsList.join(' '));
};

Dom.prototype.text = function (text) {
	this._src.textContent = text;
	this.emit('text', text);
};

Dom.prototype.html = function (html) {
	this._src.innerHTML = html;
	this.emit('html', html);
};

Dom.prototype.numberInput = function () {
	this.allowEvents(['keyup']);
	this.on('keyup', function () {
		// number only allowed
		var val = this.get('value');
		var allowed = '';
		for (var i = 0, len = val.length; i < len; i++) {
			if (val[i].match(/^[\d]+$/)) {
				allowed += val[i];
			}
		}
		this.set('value', allowed);
	});
};

Dom.prototype.drawImage = function (imagePath, options) {
	if (!options) {
		options = {};
	}
	this.setStyle({
		backgroundImage: 'url(' + imagePath + ')',
		backgroundSize: (options.size || '100%'),
		backgroundRepeat: 'no-repeat',
		backgroundPositionX: ((options.positionX !== undefined) ? options.positionX : 50) + '%',
		backgroundPositionY: ((options.positionY !== undefined) ? options.positionY: 50) + '%'
	});
	this.emit('drawImage', imagePath, options);
};

// value: Number, measure: String > %, px
Dom.prototype.width = function (value, measure) {
	setNumberStyle(this, 'width', value, measure);
};

Dom.prototype.height = function (value, measure) {
	setNumberStyle(this, 'height', value, measure);
};


Dom.prototype.x = function (value, measure) {
	setNumberStyle(this, 'left', value, measure);
};

Dom.prototype.y = function (value, measure) {
	setNumberStyle(this, 'top', value, measure);
};

Dom.prototype.show = function () {
	this._src.style.display = '';
};

Dom.prototype.hide = function () {
	this._src.style.display = 'none';
};

function setNumberStyle(dom, style, value, measure) {
	if (!measure) {
		measure = 'px';
	}
	var styles = {};
	styles[style] = value + measure;
	dom.setStyle(styles);
	dom.emit(style, value, measure);
}

}());

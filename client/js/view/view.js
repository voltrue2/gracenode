// dependencies: EventEmitter.js, button.js
(function () {

	/*
	* DOM manipulation class
	*/ 
	function Dom(elm) {
		this._elm = elm;
	}

	window.inherits(Dom, window.EventEmitter);
	window.Dom = Dom;

	Dom.prototype.getElm = function () {
		return this._elm;
	};

	Dom.prototype.getById = function (id) {
		var elm = document.getElementById(id);
		if (elm) {
			var res = new Dom(elm);
			this.emit('getById', res);
			return res;
		}
		return null;
	};

	Dom.prototype.querySelector = function (query) {
		var elm = this._elm.querySelector(query);
		if (elm) {
			var res = new Dom(elm);
			this.emit('querySelector', res);
			return res;
		}
		return null;
	};

	Dom.prototype.querySelectorAll = function (query) {
		var elmList = this._elm.querySelectorAll(query);
		var len = elmList.length;
		var list = [];
		if (len) {
			for (var i = 0; i < len; i++) {
				list.push(new Dom(elmList[i]));
			}
			this.emit('querySelectorAll', list);
		}
		return list;
	};

	Dom.prototype.createChild = function (elmName) {
		var elm = document.createElement(elmName);
		this._elm.appendChild(elm);
		var child = new Dom(elm);
		this.emit('createChild', child);
		return child;
	};

	Dom.prototype.appendChild = function (dom) {
		this._elm.appendChild(dom._elm);
		this.emit('appendChild', dom);
	};

	Dom.prototype.setStyle = function (style) {
		for (var name in style) {
			this._elm.style[name] = style[name];
		}
		this.emit('setStyle', style);
	};

	Dom.prototype.setClassName = function (cls) {
		this._elm.className = cls;
		this.emit('setClassName', cls);
	};  

	Dom.prototype.setProp = function (key, value) {
		this._elm[key] = value;
		this.emit('setProp', key);
	};

	Dom.prototype.getProp = function (key) {
		return this._elm[key] !== undefined ? this._elm[key] : null;
	};

	Dom.prototype.setAttributes = function (att) {
		for (var name in att) {
			this._elm.setAttribute(name, att[name]);
		}
		this.emit('setAttribute', att);
	};

	Dom.prototype.getAttributes = function (name) {
		return this._elm.getAttribute(name);
	};

	Dom.prototype.textContent = function (str) {
		this._elm.textContent = str;
		this.emit('textContent', str);
	};

	Dom.prototype.innerHTML = function (html) {
		this._elm.innerHTML = html;
		this.emit('innerHTML', html);
	};

	Dom.prototype.getElm = function () {
		return this._elm;
	};

	Dom.prototype.button = function () {
		return window.createButton(this._elm);		
	};

	Dom.prototype.show = function () {
		this.setStyle({ display: '' });
		this.emit('show');
	};
	
	Dom.prototype.hide = function () {
		this.setStyle({ display: 'none' });
		this.emit('hide');
	};
	
	function View(parentElm) {
		Dom.call(this);
		this._elm = parentElm;
		this._viewMap = {};
		this.name = null;
	}

	window.inherits(View, Dom);
	window.View = View;

	View.prototype.ready = function () {
		var that = this;
		window.setTimeout(function () {
		that.emit('ready', that.name, that);
		}, 0);
	};

}());

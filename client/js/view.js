// dependencies: EventEmitter.js, button.js
(function () {
	
	function View(parentElm) {
		window.Dom.call(this);
		this._elm = parentElm;
		this._viewMap = {};
	}

	window.inherits(View, window.Dom);
	window.View = View;

	View.prototype.show = function () {
		this.setStyle({ display: '' });
		this.emit('show');
	};
	
	View.prototype.hide = function () {
		this.setStyle({ display: 'none' });
		this.emit('hide');
	};

	/*
	* DOM manipulation class
	*/ 
	function Dom(elm) {
		this._elm = elm;
	}

	window.inherits(Dom, window.EventEmitter);
	
	Dom.prototype.createChild = function (elmName) {
		var elm = document.createElement(elmName);
		this._elm.appendChild(elm);
		return new Dom(elm);
	};

	Dom.prototype.setStyle = function (style) {
		for (var name in style) {
			this._elm.style[name] = style[name];
		}
	};

	Dom.prototype.setClassName = function (cls) {
		this._elm.className = cls;
	};  

	Dom.prototype.button = function () {
		return window.createButton(this._elm);		
	};

}());

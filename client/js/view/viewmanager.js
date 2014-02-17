// dependency EventEmitter
(function (window) {

	/***
	* Events: resize, add, ready, open, close, error 
	***/
	function ViewManager(parentElm) {
		window.EventEmitter.call(this);
        var that = this;
		this._viewMap = {}; // current view name
		this._stack = []; // list of popup view names currently in display
		this._current = null;
		this._parentElm = parentElm;
		this._index = 0;
		// on resize/orientation change
        var resizeEvent = 'resize';
        if ('onorientationchange' in window) {
            resizeEvent = 'orientationchange';
        }
        window.addEventListener(resizeEvent, function () {
			that.emit('resize');
			if (that._current) {
				that.getViewByName(that._current).emit('resize');
			}
			for (var i = 0, len = that._stack.length; i < len; i++) {
				var view = that.getViewByName(that._stack[i]);
				if (view) {
					view.emit('resize');
				}
			}
			// reset scroll position on orientation change
			window.setTimeout(function () {
				window.scrollTo(0, 0);
			}, 0);
		}, false);
		// hide address bar
		window.addEventListener('load', function () {
			window.setTimeout(function () {
				window.scrollTo(0, 0);
			}, 0);
		}, false);
		// disable scroll
		parentElm.addEventListener('touchmove', function (event) {
			event.preventDefault();
		}, false);
		// disable text selection
		parentElm.style.WebkitTouchCallout = 'none';
		parentElm.style.WebkitUserSelect = 'none';
		parentElm.style.userSelect = 'none';
	}

	window.inherits(ViewManager, window.EventEmitter);
	window.ViewManager = ViewManager;

	ViewManager.prototype.createView = function (name) {
		var elm = document.createElement('div');
		this._parentElm.appendChild(elm);
		var view = new window.View(elm);
		this.add(name, view);
		return view;
	};

	ViewManager.prototype.add = function (name, view) {
		if (!this._viewMap[name]) {
			this._viewMap[name] = view;
			view.name = name;
			view.hide();
			view.setStyle({
				zIndex: 0,
				width: '100%',
				height: '100%',
				position: 'absolute',
				top: 0,
				left: 0
			});
			view.setClassName('view ' + name);
			this.emit('add', name, view);
			// view emits this event when it is ready
			var that = this;
			view.once('ready', function () {
				that.emit('ready', name, view);
			});
		}
	};

	ViewManager.prototype.open = function (name, params) {
		var that = this;
		var openNewView = function () {
			var newView = that.getViewByName(name);
			if (newView) {
				newView.once('opened', function () {
					// new view has finished opening > now open the view
					that._current = name;
					// make the new view visible
					newView.show();
					// emit open
					window.setTimeout(function () {
						that.emit('open', newView);
					}, 0);
				});	
				// view must call view.emit('opened') on this event;
				newView.emit('open', params);
				return;
			}
			// no view by the given name found
			that.error('view not found: ' + name);
		};
		if (this._current) {
			// open AFTER closing
			// close the current view
			var prev = this.getViewByName(this._current);
			prev.once('closed', function () {
				this.hide();
				// previouse view has finished closing > now prepare to open the new view
				openNewView();
			});
			prev.emit('close');
			window.setTimeout(function () {
				that.emit('close', prev);
			}, 0);
			return;
		}
		// there is no previously opened view > open a new view
		window.setTimeout(function () {
			openNewView();
		}, 0);
	};

	ViewManager.prototype.openPopup = function (name, params, forceTop) {
		var view = this.getViewByName(name);
		if (!view) {
			return this.error('view not found: ' + name);
		}
		var that = this;
		if (this._crrent !== name && this._stack.indexOf(name) === -1) {
			view.once('opened', function () {
				that._stack.push(name);
				that._index++;
				view.setStyle({
					zIndex: that._index
				});
				// force this popup to be the top
				if (forceTop) {
					view.setStyle({ zIndex: 999 });
				}
				view.show();		
				window.setTimeout(function () {
					that.emit('open', view);
				}, 0);
			});
			window.setTimeout(function () {
				view.emit('open', params);
			});
		}	
	};

	ViewManager.prototype.closePopup = function () {
		var popup = this._stack.shift();
		if (popup) {
			var view = this.getViewByName(popup);
			if (view) {
				var that = this;
				view.once('closed', function () {
					that.emit('close', popup);
					that._index--;
					view.setStyle({
						zIndex: 0
					});
					view.hide();
					that.emit('close', view);
				});
				view.emit('close');
			}
		}
	};

	ViewManager.prototype.closePopupByName = function (name) {
		var index = this._stack.indexOf(name);
		if (index !== -1) {
			this._stack.splice(index, 1);
			var view = this.getViewByName(name);
			if (view) {
				var that = this;
				view.once('closed', function () {
					that.emit('close', this);
					view.hide();
				});
				view.emit('close');
			}
		}
	};

	ViewManager.prototype.getViewByName = function (name) {
		return this._viewMap[name] || null;
	};

	ViewManager.prototype.getCurrentViewName = function () {
		return this._current;
	};

	ViewManager.prototype.error = function (msg) {
		console.error(msg);
		console.trace();
		this.emit('error', msg);
	};

}(window));

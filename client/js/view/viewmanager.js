// dependency EventEmitter
(function () {

	function ViewManager(parentElm) {
		window.EventEmitter.call(this);
        var that = this;
		this._viewMap = {}; // current view name
		this._stack = []; // list of popup view names currently in display
		this._current = null;
		this._parentElm = parentElm;
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
        }, false);
        // hide address bar
        window.addEventListener('load', function () {
            window.setTimeout(function () {
                window.scrollTo(0, 0);
            }, 0);
        }, false);
		// disable scroll
		var parent = new window.Dom(parentElm);
		var btn = parent.button();
		btn.on('tapstart', function (event) {
			event.preventDefault();
		});		
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
			view.hide();
			this.emit('add', name, view);
		}
	};

	ViewManager.prototype.open = function (name) {
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
					that.emit('open', newView);
				});	
				// view must call view.emit('opened') on this event;
				newView.emit('open');
			}
			// no view by the given name found
			that.error('view not found: ' + name);
		};
		if (this._current) {
			// open AFTER closing
			// close the current view
			var prev = this.getViewByName(this._current)
			prev.once('closed', function () {
				this.hide();
				// previouse view has finished closing > now prepare to open the new view
				openNewView();
			});
			prev.emit('close');
			this.emit('close', prev);
			return;
		}
		// there is no previously opened view > open a new view
		openNewView();
	};

	ViewManager.prototype.openPopup = function (name) {
		var view = this.getViewByName(name);
		if (!view) {
			return this.error('view not found: ' + name);
		}
		var that = this;
		if (this._crrent !== name && this._stack.indexOf(name) === -1) {
			view.once('opened', function () {
				that._stack.push(name);
				view.show();		
			});
			view.emit('open');
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
					view.hide();
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
					that.emit('close', popup);
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

}());

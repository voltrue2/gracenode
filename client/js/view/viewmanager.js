// dependency EventEmitter
(function () {

	function ViewManager() {
		window.EventEmitter.call(this);
        var that = this;
		this._viewMap = {}; // current view name
		this._stack = []; // list of popup view names currently in display
		this._current = null;
		// on resize/orientation change
        var resizeEvent = 'resize';
        if ('onorientationchange' in window) {
            resizeEvent = 'orientationchange';
        }
        window.addEventListener(resizeEvent, function () {
            that.emit('resize');
            if (that._current) {
                that.getCurrentView().emit('resize');
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
	}

	window.inherits(ViewManager, window.EventEmitter);
	window.ViewManager = ViewManager;

	ViewManager.prototype.add = function (name, view) {
		if (this._viewMap[name]) {
			this._viewMap[name] = view;
			this.emit('add', name);
		}
	};

	ViewManager.prototype.open = function (name) {
		if (this._current) {
			// open AFTER closing
			var that = this;
			var prevView = this.getCurrentView();
			var openNewView = function () {
				var newView = that.getViewByName(name);
				if (newView) {
					newView.once('opened', function () {
						// new view has finished opening > now open the view
						that._current = name;
						// make the new view visible
						newView.show();
					});	
					// view must call view.emit('opened') on this event;
					newView.emit('open');
				}
				// no view by the given name found
				that.error('view not found: ' + name);
			};
			// close the current view
			return prevView.once('closed', function () {
				that.emit('close', that._current);
				prevView.hide();
				// previouse view has finished closing > now prepare to open the new view
				openNewView();
			});
			prevView.emit('close');
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

	ViewManager.prototype.getCurrentView = function () {
		return this._current;
	};

	ViewManager.prototype.error = function (msg) {
		console.error(msg);
		console.trace();
		this.emit('error', msg);
	};

}());

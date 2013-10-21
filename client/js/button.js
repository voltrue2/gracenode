(function () {

	/*
	 * Dependency: EventEmitter
	 *
	 * Usage: 
	 *
	 * var myButton = window.createButton(myDomElement);
	 *
	 * myButton.on('tapstart', function (event) {
	 *	console.log('tap start');
	 * });
	 *
	 * myButton.on('tapmove', function (event) {
	 *	console.log('tap move');
	 * });
	 *
	 * myButton.on('tapend', function (event) {
	 *	console.log('tap end');
	 * });
	 *
	 * myButton.on('tapcancel', function (event) {
	 *	console.log('tap cancel');
	 * });
	 *
	 * myButton.on('disable', function () {
	 *	console.log('disabled');
	 * });
	 * myButton.disable();
	 *
	 * myButton.on('enable', function () {
	 *	console.log('enable');
	 * });
	 * myButton.enable();
	 *
	 * myButton.on('destroy', function () {
	 *	console.log('destory');
	 * });
	 * myButton.destroy();
	 *
	 * */

	var eventMap = {
		touch: {
			start: 'touchstart',
			move: 'touchmove',
			end: 'touchend'
		},
		noTouch: {
			start: 'mousedown',
			move: 'mousemove',
			end: 'mouseup'
		}
	};

	var events = null;
	if (canTouch()) {
		events = eventMap.touch;
	} else {
		events = eventMap.noTouch;
	}

	function createButton(htmlElm) {
		if (!htmlElm || !htmlElm.addEventListener) {
			return console.error('<error> createButton: invalid html element given');
		}

		var handleStart = function (event) {
			button.emitStart(event);	
			event.preventDefault();
		};

		var handleMove = function (event) {
			button.emitMove(event);	
			event.preventDefault();
		};

		var handleEnd = function (event) {
			button.emitEnd(event);
			event.preventDefault();
		};
		
		htmlElm.addEventListener(events.start, handleStart, false);
		htmlElm.addEventListener(events.move, handleMove, false);
		htmlElm.addEventListener(events.end, handleEnd, false);
	
		var button = new Button(htmlElm, handleStart, handleMove, handleEnd);
	
		return button;
	}

	window.createButton = createButton;

	function canTouch() {
		if ('ontouchstart' in window && 'ontouchend' in window && 'ontouchmove' in window) {
			return true;
		} else {
			return false;
		}
	}

	function Button(htmlElm, handleStart, handleMove, handleEnd) {
		this.htmlElm = htmlElm;
		this.handleStart = handleStart;
		this.handleMove = handleMove;
		this.handleEnd = handleEnd;
		this.disabled = false;
		this.isDown = false;
		this.swipeData = {};
	}

	window.inherits(Button, window.EventEmitter);

	Button.prototype.destroy = function () {
		this.htmlElm.removeEventListener(events.start, this.handleStart);
		this.htmlElm.removeEventListener(events.move, this.handleMove);
		this.htmlElm.removeEventListener(events.end, this.handleEnd);
		this.emit('destroy');
	};

	Button.prototype.enable = function () {
		this.disabled = false;
		this.emit('enable');
	};

	Button.prototype.disable = function () {
		this.disabled = true;
		this.emit('disable');
	};

	Button.prototype.emitStart = function (event) {
		if (!this.disabled && !this.isDown) {
			this.isDown = true;
			this.emit('tapstart', event);
			this.swipeData = getPos(event);
		}
	};
	
	Button.prototype.emitMove = function (event) {
		if (!this.disabled) {
			this.emit('tapmove', event);
			if (this.isDown) {
				this.isDown = false;
				this.emit('tapcancel', event);
			}
		}
	};
	
	Button.prototype.emitEnd = function (event) {
		if (!this.disabled && this.isDown) {
			this.isDown = false;
			this.emit('tapend', event);
			// calculate swipe
			var touch = getPos(event);
			var deltaX = touch.x - this.swipeData.x;
			var deltaY = touch.y - this.swipeData.y;
			var swipe = {
				deltaX: deltaX,
				deltaY: deltaY,
				absX: Math.abs(deltaX),
				absY: Math.abs(deltaY)
			};
			if (deltaX !== 0 || deltaY !== 0) {
				this.emit('swipe' , event, swipe);
			}
		}
	};

	function getPos(event) {
		var touch = {};
		if (event.touches) {
			touch = event.touches[0] || { pageX: 0, pageY: 0 };
		} else {
			touch = { pageX: event.x || 0, pageY: event.y || 0 };
		}
		return { x: touch.pageX, y: touch.pageY };
	}

}());

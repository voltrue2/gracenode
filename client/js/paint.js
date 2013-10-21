(function () {

	/**
	 * Dependencies: EeventEmitter.js
	 *
	 * **/
	function Paint(elm, width, height) {
		window.EventEmitter.call(this);
		this._src = elm;
		this._width = width;
		this._height = height;
		this._canvas = document.createElement('canvas');
		this._canvas.width = width;
		this._canvas.height = height;
		this._src.appendChild(this._canvas);
		this._currentFrame = 0;
		this._milsecPerFrame = 0;
		this._ready = false;
		this._running = false;
		this._debugElm = null;
		this._debugUpdateTime = 0;
		// default settings
		this._debug = false;
		this._fps = 40;
		this._loop = false;
		this._context = '2d';
		// definitions
		this._meta = {};
		this._obj = {};
		this._frames = []; // index = frame number
		this._endFrame = 0;
		this._setupTouchEvents();
	}

	window.inherits(Paint, window.EventEmitter);
	window.Paint = Paint;

	/*
	 * 
	 * 
	 **/
	Paint.prototype.load = function (def) {
		if (def && def.meta && def.obj && def.frames) {
			this._parseMeta(def);
			this._parseObj(def);
			this._parseFrames(def);
			this._preloadResources();
			this.emit('load');
			return true;
		}
		console.error('<error> invalid definition object given', def);
		return false;
	};	

	Paint.prototype.unload = function () {
		this._ready = false;
		this._meta = {};
		this._obj = {};
		this._frames = [];
		this._reset();
		this.emit('unload');
	};

	Paint.prototype.start = function () {
		if (this._ready && !this._running) {
			this._running = true;
			this._run();
			this.emit('start');
		}
	};

	Paint.prototype.stop = function () {
		if (this._running) {
			this._running = false;
			this._reset();
			this.emit('stop');
		}
	};

	Paint.prototype.pause = function () {
		if (this._running) {
			this._running = false;
			this.emit('pause');
		}
	};

	Paint.prototype.jumpTo = function (frame) {
		this._currentFrame = frame;
		this._update();
		this.emit('jumpTo', frame);
	};

	Paint.prototype.updateFPS = function (fps) {
		this._fps = fps;
		this._meta.fps = fps;
		this._milsecPerFrame = 1000 / this._fps;
		if (this._running) {
			this._run();
		}
		this.emit('updateFPS', fps);
	};

	Paint.prototype._parseMeta = function (def) {
		var meta = def.meta;
		if (meta.debug) {
			this._debug = true;
		}
		if (meta.fps !== undefined) {
			this._fps = meta.fps;
		}
		if (meta.loop !== undefined) {
			this._loop = meta.loop;
		}
		this._milsecPerFrame = 1000 / this._fps;
		var cnt = '2d';
		if (meta.context && (meta.context === '2d' || meta.context === 'webgl')) {
			cnt = meta.context;
		}
		this._context = this._canvas.getContext(cnt);
		this._meta = meta;
	};

	Paint.prototype._parseObj = function (def) {
		for (var i = 0, len = def.obj.length; i < len; i++) {
			this._obj[def.obj[i].id] = def.obj[i];
		}
	};

	Paint.prototype._parseFrames = function (def) {
		this._frames = def.frames;
		this._endFrame = def.frames.length;
	};

	Paint.prototype._preloadResources = function () {
		var that = this;
		var next = function (map, cb) {
			var obj = null;
			var reducedMap = {};
			for (var key in map) {
				if (obj === null) {
					obj = map[key];
				} else {
					reducedMap[key] = map[key];
				}
			}
			if (obj && obj.type === 'image') {
				// preload
				var img = new Image();
				img.src = obj.src;
				img.onload = function () {
					that._obj[obj.id].resource = img;
					next(reducedMap, cb);
				};
			} else if (obj) {
				next(reducedMap, cb);
			} else {
				// done
				that._ready = true;
				that.emit('loaded');
			}
		};
		// start preloading
		next(this._obj, next);
	};

	Paint.prototype._run = function () {
		if (this._debug) {
			this._debugUpdateTime = Date.now();
		}
		// handle first frame
		this._update();
		// set up update per frame
		var that = this;
		var updater = function () {
			that._update();
			if (that._running) {
				window.setTimeout(updater, that._milsecPerFrame);
			}
		};
		// start running
		window.setTimeout(updater, this._milsecPerFrame);
	};

	Paint.prototype._reset = function () {
		this._currentFrame = 0;
	};

	Paint.prototype._update = function () {
		if (this._debug && this._running) {
			this._displayDebug();
		}
		this._handleFrame();
		this._currentFrame++;
	};

	/*
	* structure of a frame
	frames: { 1: [obj, obj, obj...] }, 2: {...}
	*
	*/
	Paint.prototype._handleFrame = function () {
		if (this._frames[this._currentFrame]) {
			// frame to handle found
			this._draw(this._frames[this._currentFrame]);
		}
		if (this._currentFrame === this._endFrame) {
			if (this._loop) {
				this._reset();
			} else {
				this.stop();
			}
		}
	};

	Paint.prototype._draw = function (frame) {
		// draw each obj in a frame
		var objList = frame.concat();
		for (var i = 0, len = objList.length; i < len; i++) {
			this._drawObj(objList[i]);
		}
	};

	/* 
	 * structure of obj
	 * {
	 *	id: String unique identifier for each obj
	 *	type: rect/image/text
	 *	width: Number,
	 *	height: Number
	 *	x: Number
	 *	y: Number
	 *	src: String for image or text
	 *	color: hext string for rect
	 *	font: string for text
	 * }
	 */
	Paint.prototype._drawObj = function (obj) {
		if (!this._obj[obj.id]) {
			// missing obj in obj map
			return;
		}
		var tmp = this._obj[obj.id];
		for (var prop in tmp) {
			if (obj[prop] === undefined) {
				obj[prop] = tmp[prop];
			}
		}
		this._context.save();
		switch (obj.type) {
			case 'rect':
				this._drawRect(obj);
				break;
			case 'circle':
				this._drawCircle(obj);
				break;
			case 'image':
				this._drawImage(obj);
				break;
			case 'text':
				this._drawText(obj);
				break;
			default:
				// do nothing
				break;
		}
		this._context.restore();
	};

	Paint.prototype._drawRect = function (obj) {
		var anchorX = 0;
		var anchorY = 0;
		var x = obj.x || 0;
		var y = obj.y || 0;
		if (obj.anchorX) {
			x += obj.anchorX;
			anchorX = -1 * obj.anchorX;
		}
		if (obj.anchorY) {
			y += obj.anchorY;
			anchorY = -1 * obj.anchorY;
		}
		this._context.globalAlpha = obj.alpha || 1;
		this._context.beginPath();
		this._context.translate(x, y);
		this._handleDrawRotate(obj);
		this._handleDrawColor(obj);
		this._context.rect(anchorX, anchorY, obj.width || 0, obj.height || 0);
		this._context.fill();
		this._handleDrawLine(obj);
	};

	Paint.prototype._drawCircle = function (obj) {
		var anchorX = 0;
		var anchorY = 0;
		var x = obj.x || 0;
		var y = obj.y || 0;
		if (obj.anchorX) {
			x += obj.anchorX;
			anchorX = -1 * (obj.anchorX * 2);
		}
		if (obj.anchorY) {
			y += obj.anchorY;
			anchorY = -1 * (obj.anchorY * 2);
		}
		var centerX = obj.width / 2;
		var centerY = obj.height / 2;
		var radius = obj.radius;
		this._context.globalAlpha = obj.alpha || 1;
		this._context.beginPath();
		this._context.translate(x, y);
		this._handleDrawRotate(obj);
		this._handleDrawColor(obj);
		this._context.arc(centerX + anchorX, centerY + anchorY, radius, 0, 2 * Math.PI, false);
		this._context.fill();
		this._handleDrawLine(obj);
	};

	Paint.prototype._drawImage = function (obj) {
		if (!obj.src || !obj.resource) {
			return;
		}
		var anchorX = 0;
		var anchorY = 0;
		var x = obj.x || 0;
		var y = obj.y || 0;
		if (obj.anchorX) {
			x += obj.anchorX;
			anchorX = -1 * obj.anchorX;
		}
		if (obj.anchorY) {
			y += obj.anchorY;
			anchorY = -1 * obj.anchorY;
		}
		this._context.globalAlpha = obj.alpha || 1;
		this._context.translate(x, y);
		this._handleDrawRotate(obj);
		this._context.drawImage(obj.resource, anchorX, anchorY, obj.width || obj.resource.width, obj.height || obj.resource.height);
	};

	Paint.prototype._drawText = function (obj) {
		if (!obj.src) {
			return cb();
		}
		var anchorX = 0;
		var anchorY = 0;
		var x = obj.x || 0;
		var y = obj.y || 0;
		if (obj.anchorX) {
			x += obj.anchorX;
			anchorX = -1 * obj.anchorX;
		}
		if (obj.anchorY) {
			y += obj.anchorY;
			anchorY = -1 * obj.anchorY;
		}
		this._context.globalAlpha = obj.alpha || 1;
		this._context.fillStyle = obj.color || '#000000';
		this._context.font = obj.font || (obj.fontWeight || 'normal') + ' ' + (obj.fontSize || 15) + 'px ' + (obj.fontFamily || 'Arial');
		this._context.translate(x, y);
		this._handleDrawRotate(obj);
		if (obj.color) {
			this._context.fillText(obj.src, anchorX, anchorY);
		}
		if (obj.textStrokeColor) {
			this._context.strokeStyle = obj.textStrokeColor;
			this._context.lineWidth = obj.textStrokeWith || 1;
			this._context.strokeText(obj.src, anchorX, anchorY);
		}
	};

	Paint.prototype._handleDrawRotate = function (obj) {
		if (obj.rotate) {
			this._context.rotate(obj.rotate * Math.PI / 180);
		}
	};

	Paint.prototype._handleDrawColor = function (obj) {
		if (obj.gradient) {
			var grd = null;
			var gradient = obj.gradient;
			if (gradient.type === 'linear') {
				grd = this._context.createLinearGradient(0, 0, gradient.width, gradient.height);
			} else if (obj.gradient.type === 'radial') {
				grd = this._context.createRadialGradient(gradient.x1 || 0, gradient.y1 || 0, gradient.radiusStart || 5, gradient.x2 || obj.width, gradient.y2 || obj.height, gradient.radiusEnd || obj.height);
			}
			if (grd && obj.gradient.colors) {
				for (var pos in obj.gradient.colors) {
					grd.addColorStop(Number(pos), obj.gradient.colors[pos]);
				}
				this._context.fillStyle = grd;
			} else {
				// missing
				this._context.fillStyle = '#000000';
			}
		} else {
			this._context.fillStyle = obj.color || '#000000';
		}
	};

	Paint.prototype._handleDrawLine = function (obj) {
		if (obj.borderWidth && obj.borderColor) {
			this._context.lineWidth = obj.borderWidth;
			this._context.strokeStyle = obj.borderColor;
			this._context.stroke();
		}
	}; 

	Paint.prototype._setupTouchEvents = function () {
		var that = this;
		var btn = window.createButton(this._canvas);
		var findTapped = function (event) {
			var x = 0;
			var y = 0;
			if (event.touches) {
				x = event.touches[0].pageX;
				y = event.touches[0].pageY;
			} else {
				x = event.clientX;
				y = event.clientY;
			}
			var tapped = null;
			if (that._frames[that._currentFrame]) {
				var list = that._frames[that._currentFrame];
				for (var i = 0, len = list.length; i < len; i++) {
					var objData = list[i];
					var obj = that._obj[objData.id] || null;
					if (obj) {
						var tmp = {};
						for (var p in obj) {
							tmp[p] = obj[p];
						}
						for (var prop in objData) {
							tmp[prop] = objData[prop];
						}	
						if (tmp.x <= x && tmp.y <= y && tmp.x + tmp.width >= x && tmp.y + tmp.height >= y) {
							tapped = tmp;
						}
					}
				}
			}
			that._tapDebug(tapped);
			return tapped;
		};
		btn.on('tapstart', function (event) {
			that._tapDebugPause(true);
			var tapped = findTapped(event);
			that.emit('tapstart', tapped);
		});
		btn.on('tapend', function (event) {
			that._tapDebugPause(false);
			var tapped = findTapped(event);
			that.emit('tapend', tapped);
		});
		btn.on('tapcancel', function (event) {
			that._tapDebugPause(false);
			var tapped = findTapped(event);
			that.emit('tapcancel', tapped);
		});
	};

	Paint.prototype._displayDebug = function () {
		if (!this._debugElm) {
			this._debugElm = document.createElement('div');
			this._debugElm.style.fontSize = '12px';
			this._debugElm.style.color = '#fff';
			this._debugElm.style.background = 'rgba(0, 0, 0, 0.7)';
			this._debugElm.style.padding = '5px';
			this._debugElm.style.position = 'absolute';
			this._debugElm.style.top = 0;
			this._debugElm.style.left = 0;
			this._debugElm.style.fontFamily = 'Verdana';
			this._debugElm.style.border = '1px solid #fff';
			this._debugElm.style.width = this._width + 'px';
			document.body.appendChild(this._debugElm);
		}
		var now = Date.now();
		var diff = now - this._debugUpdateTime;
		var fps = 0;
		if (diff > 0) {
			fps = Math.round(1000 / diff);
		}
		this._debugUpdateTime = now;

		this._debugElm.textContent = 'FPS: ' + fps + '/' + this._fps + ' current frame: ' + this._currentFrame + ' # of obj: ' + (this._frames[this._currentFrame] ? this._frames[this._currentFrame].length : 0);
	};

	Paint.prototype._tapDebug = function (obj) {
		if (this._debug) {
			this._context.save();
			obj.alpha = 0.2;
			obj.borderWidth = 1;
			obj.borderColor = '#ffffff';
			obj.color = '#0000ff';
			this._drawRect(obj);
			this._context.restore();
		}
	};

	Paint.prototype._tapDebugPause = function (pause) {
		if (pause) {
			this.pause();
			return;
		}
		this.start();
	};

}());

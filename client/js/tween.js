(function (window) {
	/**
	* Usage: var myTween = new window.core.wuic.Tween(window.core.wuic.Tween.Linear, startValue, endValue, delayInSecond, durationInSecond);
			myTween.on('change', function (currentValue) {
				// we update with currentValue
			});
			myTween.start();
			// to update, we call myTween.update() with timer
	*
	* @Tween.repeat (Number): set this to -1 for forever loop
	*/

	/**
	* @easing (Function)
	* @begin (Object) {vlaue1: 0, value2: 10 }
	* @finish (Object) { value1: 100, value2: 110 }
	* @delay (Number)
	* @duration (Number)
	*/
	function Tween(easingFunc, begin, finish, delay, duration) {
		EventEmitter.call(this);
		// public properties
		this.repeat = 0;
		// private propreties
		this._repeatCounter = 0;
		this._originals = { begin: begin, finish: finish };
		this._change = {};
		this._time = 0;
		this._startTime = 0;
		this._duration = 0;
		this._finish = finish;
		this._begin = begin;
		this._delay = delay;
		this._isPlaying = false;
		this._setDuration(duration);
		if (easingFunc !== null && easingFunc !== '') {
			this._easingFunc = easingFunc;
		} else {
			this._easingFunc = Tween.Linear;
		}
	}

	window.inherits(Tween, EventEmitter);
	window.Tween = Tween;

	/***
	* Public Methods
	*/

	Tween.prototype.start = function () {
		this._begin = this._originals.begin;
		this._finish = this._originals.finish;
		this._pos = this._begin;
		// set finish
		this._setFinish(this._finish);
		if (this._delay) {
			var delay = this._delay * 1000;
			this._handleDelay(Date.now(), delay);
		} else {
			this._start();
		}
	};

	Tween.prototype.reverse = function () {
		this._begin = this._originals.finish;
		this._finish = this._originals.begin;
		this._pos = this._begin;
		// set finish
		this._setFinish(this._finish);
		if (this._delay) {
			var delay = this._delay * 1000;
			this._handleDelay(Date.now(), delay);
		} else {
			this._start();
			this.emit('reverse');
		}
	};

	Tween.prototype.resume = function () {
		this._fixTime();
		this._startEnterFrame();
		this.emit('resume');
	};

	Tween.prototype.loop = function () {
		this._continueTo(this._begin, this._time);
	};

	Tween.prototype.stop = function(){
		this._stopEnterFrame();
		this.emit('stop');
	};

	Tween.prototype.update = function () {
		if(this._isPlaying) {
			var t = (this._getTimer() - this._startTime) / 1000;
			if (t > this._duration) {
				// finish
				this._time = this._duration;
				this._setPosition(this._getPosition(this._time));
				this.stop();
				// check for repeat
				if (this.repeat < 0) {
					// infinite loop
					this.loop();
				} else {
					this._repeatCounter += 1;
					if (this._repeatCounter <= this.repeat) {
						this.loop();
					} else {
						this._repeatCounter = 0;
						this.emit('finish', this._pos);
					}
				}

			} else if (t < 0) {
				// loop
				this._rewind();
				this._setPosition(this._getPosition(this._time));
			} else {
				// start or reverse
				this._time = t;
				this._setPosition(this._getPosition(this._time));
			}
		}
		// internal update event
		this.emit('_update');
		return this._pos; // same value is emitted on change
	};

	/***
	* Static Methods
	*/

	Tween.Linear = function (t, b, c, d) {
		return c*t/d + b;
	};

	Tween.QuadIn = function (t, b, c, d) {
		return c*(t/=d)*t + b;
	};

	Tween.QuadOut = function (t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	};

	Tween.QuadInOut = function (t, b, c, d) {
		t /= d/2;
		if(t < 1) {
			return c/2*t*t+b;
		} else {
			return -c/2 *((--t)*(t-2) - 1) + b;
		}
	};

	Tween.CubicIn = function (t, b, c, d) {
		return c*(t/=d)*t*t + b;
	};

	Tween.CubicOut = function (t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	};

	Tween.CubicInOut = function (t, b, c, d) {
		t /= d/2;
		if(t < 1) {
			return c/2*t*t*t + b;
		} else {
			return c/2*((t-=2)*t*t + 2) + b;
		}
	};

	Tween.CubicOutIn = function (t, b, c, d) {
		if(t < d/2) {
			return Tween.CubicOut(t*2, b, c/2, d);
		}
		return Tween.CubicIn((t*2)-d, b+c/2, c/2, d);
	};

	Tween.SineIn = function (t, b, c, d) {
		return -c * Math.cos(t/d *(Math.PI/2)) + c + b;
	};

	Tween.SineOut = function (t, b, c, d) {
		return c * Math.sin(t/d *(Math.PI/2)) + b;
	};

	Tween.SineInOut = function (t, b, c, d) {
		return -c/2 *(Math.cos(Math.PI*t/d) - 1) + b;
	};

	Tween.SineOutIn = function (t, b, c, d) {
		if(t < d/2) {
			return Tween.SineOut(t*2, b, c/2, d);
		}
		return Tween.SineIn((t*2)-d, b+c/2, c/2, d);
	};

	Tween.CircIn = function (t, b, c, d) {
		return -c *(Math.sqrt(1 -(t/=d)*t) - 1) + b;
	};

	Tween.CircOut = function (t, b, c, d) {
		return c * Math.sqrt(1 -(t=t/d-1)*t) + b;
	};

	Tween.CircInOut = function (t, b, c, d) {
		t /= d/2;
		if(t < 1) {
			return -c/2 *(Math.sqrt(1 - t*t) - 1) + b;
		}
		return c/2 *(Math.sqrt(1 -(t-=2)*t) + 1) + b;
	};

	Tween.CircOutIn = function (t, b, c, d) {
		if(t < d/2) {
			return Tween.CircOut(t*2, b, c/2, d);
		}
		return Tween.CircIn((t*2)-d, b+c/2, c/2, d);
	};

	Tween.BackIn = function (t, b, c, d, a, p) {
		var s = 1.70158;
		return c*(t /= d)*t*((s+1)*t - s) + b;
	};

	Tween.BackOut = function (t, b, c, d, a, p) {
		var s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	};

	Tween.BackInOut = function (t, b, c, d, a, p) {
		var s = 1.70158;
		if ((t /= d / 2) < 1) {
			return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		}
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	};

	Tween.ElasticIn = function (t,b,c,d,a,p) {
		if (t === 0) {
			return b;
		}
		if ((t /= d) === 1) {
			return b+c;
		}
		var s = 0;
		if (!p) {
			p =d * 0.3;
		}
		if (!a || a < Math.abs(c)) {
			a = c;
			s = p/4;
		} else {
			s = p/(2*Math.PI) * Math.asin (c/a);
		}
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	};

	Tween.ElasticOut = function (t,b,c,d,a,p) {
		if (t === 0) {
			return b;
		}
		if ((t/=d)==1) {
			return b+c;
		}
		if (!p) {
			p = d * 0.3;
		}
		var s = 0;
		if (!a || a < Math.abs(c)) {
			a = c;
			s = p / 4;
		} else {
			s = p/(2*Math.PI) * Math.asin (c/a);
		}
		return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
	};

	Tween.ElasticInOut = function (t,b,c,d,a,p) {
		if (t === 0) {
			return b;
		}
		if ((t /= d / 2) == 2) {
			return b+c;
		}
		if (!p) {
			p = d * (0.3 * 1.5);
		}
		var s = 0;
		if (!a || a < Math.abs(c)) {
			a = c;
			s = p / 4;
		} else {
			s = p / (2 * Math.PI) * Math.asin (c/a);
		}
		if (t < 1) {
			return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin( (t * d - s) * (2 * Math.PI) / p )) + b;
		}
		return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
	};

	Tween.BounceOut = function (t,b,c,d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
		}
	};

	Tween.BounceIn = function (t,b,c,d) {
		return c - Tween.bounceOut (d-t, 0, c, d) + b;
	};

	Tween.BounceInOut = function (t,b,c,d) {
		if (t < d/2) {
			return Tween.bounceIn (t*2, 0, c, d) * 0.5 + b;
		} else {
			return Tween.bounceOut (t*2-d, 0, c, d) * 0.5 + c * 0.5 + b;
		}
	};

	Tween.RegularIn = function (t,b,c,d) {
		return c*(t /= d)*t + b;
	};

	Tween.RegularOut = function (t,b,c,d) {
		return -c *(t /= d)*(t-2) + b;
	};

	Tween.RegularInOut = function (t,b,c,d) {
		if ((t /= d / 2) < 1) {
			return c/2*t*t + b;
		}
		return -c/2 * ((--t)*(t-2) - 1) + b;
	};

	Tween.StrongIn = function (t,b,c,d) {
		return c*(t /= d)*t*t*t*t + b;
	};

	Tween.StrongOut = function (t,b,c,d) {
		return c*((t = t / d - 1)*t*t*t*t + 1) + b;
	};

	Tween.StrongInOut = function (t,b,c,d) {
		if ((t /= d/2) < 1) {
			return c/2*t*t*t*t*t + b;
		}
		return c/2*((t -= 2)*t*t*t*t + 2) + b;
	};

	/***
	* Private Methods
	*/

	Tween.prototype._handleDelay = function (start, delayDuration) {
		var that = this;
		this.on('_update', waitMore);
		// delay callback
		function waitMore() {
			if (Date.now() - start >= delayDuration) {
				// no more delay
				that.removeListener('_update', waitMore);
				that._start();
			}
		}
	};

	Tween.prototype._start = function () {
		this._rewind();
		this._startEnterFrame();
		this.emit('start');
	};

	Tween.prototype._setDuration = function (d) {
		this._duration = (d === null || d <= 0) ? 100000 : d;
	};

	Tween.prototype._setPosition = function (p) {
		this._pos = p;
		this.emit('change', p);
	};

	Tween.prototype._getPosition = function (t) {
		if (t === undefined) {
			t = this._time;
		}
		var ret = {};
		for (var prop in this._begin) {
			var offset = this._change[prop] || 0;
			ret[prop] = this._easingFunc(t, this._begin[prop], offset, this._duration);
		}
		return ret;
	};

	Tween.prototype._setFinish = function (f) {
		for (var prop in this._begin) {
			if (f && f[prop] !== undefined) {
				this._change[prop] = f[prop] - this._begin[prop];
			}
		}
	};

	Tween.prototype._getFinish = function () {
		var ret = {};
		for (var prop in this._begin) {
			var offset = this._change[prop] || 0;
			ret[prop] = this._begin[prop] + offset;
		}
		return ret;
	};

	Tween.prototype._rewind = function (t) {
		this.stop();
		this._time = (t === undefined) ? 0 : t;
		this._fixTime();
		this._setPosition(this._getPosition(this._time));
	};

	Tween.prototype._fforward = function () {
		this._time = this._duration;
		this._fixTime();
		this._setPosition(this._getPosition(this._time));
	};

	Tween.prototype._startEnterFrame = function () {
		this._stopEnterFrame();
		this._isPlaying = true;
		this._setPosition(this._getPosition(this._time));
	};

	Tween.prototype._stopEnterFrame = function () {
		this._isPlaying = false;
	};

	Tween.prototype._continueTo = function (finish, duration) {
		this._begin = this._pos;
		this._setFinish(finish);
		if (this._duration !== undefined) {
			this._setDuration(duration);
		}
		this._start();
	};

	Tween.prototype._fixTime = function () {
		this._startTime = this._getTimer() - this._time * 1000;
	};

	Tween.prototype._getTimer = function () {
		return Date.now() - this._time;
	};

}(window));

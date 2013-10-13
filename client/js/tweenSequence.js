(function (window) {

	function TweenSequence(tweens) {
		EventEmitter.call(this);
		this._tweens = tweens;
		this._tweenLen = tweens.length;
		this._current = null;
	}

	window.inherits(TweenSequence, EventEmitter);
	window.TweenSequence = TweenSequence;

	TweenSequence.prototype.start = function () {
		// stop any previously running tween
		if (this._current) {
			this._current.stop();
		}
		// reset sequence list
		this._seq = this._tweens.slice();
		// start sequence
		this._start();
		this.emit('start');
	};

	TweenSequence.prototype.reverse = function () {
		// stop any previously running tween
		if (this._current) {
			this._current.stop();
		}
		// reset sequence list
		this._seq = this._tweens.slice();
		// start sequence in reverse order
		this._reverse();
		this.emit('reverse');
	};

	TweenSequence.prototype.update = function () {
		if (this._current) {
			var updates = this._current.update();
			this.emit('change', updates);
			return updates;
		}
		return null;
	};

	TweenSequence.prototype._setup = function () {
		var that = this;
		for (var i = 0; i < this._tweenLen; i++) {
			this._tweens[i].on('change', onChange);
		}
		// on change callback
		function onChange(values) {
			that.emit('change', values);
		}
	};

	TweenSequence.prototype._start = function () {
		var that = this;
		this._current = this._seq.shift();
		var onFinish = function (values) {
			if (that._seq.length > 0) {
				// next tween
				that._start();
			} else {
				// end of the last tween in our sequence list
				that._current = null;
				that.emit('finish');
			}
		};
		this._current.once('finish', onFinish);
		this._current.start();
	};

	TweenSequence.prototype._reverse = function () {
		var that = this;
		this._current = this._seq.pop();
		var onFinish = function (values) {
			if (that._seq.length > 0) {
				// next tween
				that._reverse();
			} else {
				// end of the last tween in our sequence list
				that._current = null;
				that.emit('finish');
			}
		};
		this._current.once('finish', onFinish);
		this._current.reverse();
	};

}(window));
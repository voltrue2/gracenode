(function (window) {

	function TweenCluster() {
		EventEmitter.call(this);
		this._finished = false;
		this._sprites = {};
		this._tweens = [];
		this._tweenNames = [];
		this._tweenLen = 0;
	}

	window.inherits(TweenCluster, EventEmitter);
	window.TweenCluster = TweenCluster;

	TweenCluster.prototype.addSprite = function (name, sprite, defaults) {
		this._sprites[name] = { sprite: sprite, defaults: defaults };
		sprite.addTween(name, this);
	};

	TweenCluster.prototype.removeSpriteByName = function (name) {
		if (!this._sprites[name]) {
			return console.warn('TweenCluster.removeSpriteByName: cannot remove sprite "', name ,'"');
		}
		this._sprites[name].sprite.removeTween(this);
		delete this._sprites[name];
	};

	TweenCluster.prototype.removeSprite = function (sprite) {
		for (var name in this._sprites) {
			if (this._sprites[name].sprite === sprite) {
				delete this._sprites[name];
				return sprite.removeTween(this);
			}
		}
		return console.warn('TweenCluster.removeSprite: cannot remove sprite', sprite);
	};

	TweenCluster.prototype.addTween = function (name, tween) {
		this._tweens.push(tween);
		this._tweenNames.push(name);
		this._tweenLen += 1;
	};

	TweenCluster.prototype.removeTween = function (tween) {
		var index = this._tweens.indexOf(tween);
		this._removeTweenByIndex(index);
	};

	TweenCluster.prototype.removeTweenByName = function (name) {
		var index = this._tweenNames.indexOf(name);
		this._removeTweenByIndex(index);
	};

	TweenCluster.prototype.update = function () {
		if (this._finished) {
			return;
		}
		var tweens = this._tweens.concat();
		var tweenLen = this._tweenLen;
		var sprites = this._sprites;
		// calculate updates
		var updates = {};
		for (var i = 0; i < tweenLen; i++) {
			var tween = tweens[i];
			var values = tween.update();
			for (var key in values) {
				updates[key] = (updates[key] || 0) + values[key];
			}
		}
		// handle updates for each sprite
		for (var name in sprites) {
			// apply default values
			var sp = sprites[name];
			var sprite = sp.sprite;
			var defaults = sp.defaults;
			// add defaults per sprite to updates
			for (var prop in updates) {
				sprite[prop] = updates[prop] + (defaults[prop] || 0);
			}
		}
		// emit
		this.emit('change', Date.now());
	};

	TweenCluster.prototype.start = function () {
		var finished = 0;
		var that = this;
		this._finished = false;
		// setup listeners
		this.once('finish', function () {
			that._finished = true;
		});
		// start all tweens
		var tweens = this._tweens.concat();
		for (var i = 0, len = this._tweenLen; i < len; i += 1) {
			var tween = tweens[i];
			// set up event listener
			tween.once('finish', handleTweenFinish);
			// start tween
			tween.start();
		}

		this.emit('start');

		function handleTweenFinish() {
			finished += 1;
			if (finished === that._tweenLen) {
				// all tween finished
				that.emit('finish');
			}
		}
	};

	TweenCluster.prototype.reverse = function () {
		var finished = 0;
		var that = this;
		this._finished = false;
		// setup listeners
		this.once('finish', function () {
			that._finished = true;
		});
		// start all tweens
		var tweens = this._tweens.concat();
		for (var i = 0, len = this._tweenLen; i < len; i += 1) {
			var tween = tweens[i];
			// set up event listener
			tween.once('finish', handleTweenFinish);
			// start tween in reverse order
			tween.reverse();
		}

		this.emit('reverse');

		function handleTweenFinish() {
			finished += 1;
			if (finished === that._tweenLen) {
				// all tween finished
				that.emit('finish');
			}
		}
	};

	TweenCluster.prototype._removeTweenByIndex = function (index) {
		if (index !== -1) {
			this._tweens.splice(index, 1);
			this._tweenNames.splice(index, 1);
			this._tweenLen -= 1;
		} else {
			console.warn('TweenCluster._removeTweenByIndex: failed to remove tween > ' + index);
		}
	};

}(window));
// css 3 animation
(function () {

	var animCounter = 0;

	function Animation() {
		window.EventEmitter.call(this);
		this._params = {
			direction: 'normal',
			'iteration-count': 1,
			'timeing-function': 'linear',
			delay: 0,
			keepLastState: true
		};
		this._duration = '0s';
		this._keyframes = [];
		this.name = 'anim-' + animCounter;
		animCounter++;
	}

	window.inherits(Animation, window.EventEmitter);

	/*
	* params: {
	*	direction: normal/alternate,
	*	iteration: integer *-1 to be an infinite loop,
	*	easing: css animation easing *linear, ease-in, ease-out, ease-in-out, cubic-bezier(n,n,n,n) n=0/1,
	*	delay: integer *in second,
	*	keepLastState: true/false
	* }
	*/
	Animation.prototype.setup = function (params) {
		if (params.direction) {
			this._params.direction = params.direction;
		}
		if (params.iteration !== undefined) {
			if (params.iteration === -1) {
				params.iteration = 'infinite';
			}
			this._params['iteration-count'] = params.iteration;
		}
		if (params.easing) {
			this._params['timing-function'] = params.easing;
		}
		if (params.delay) {
			this._params.delay = params.delay + 's';
		}
		if (params.keepLastState !== undefined) {
			this._params.keepLastState = params.keepLastState;
		}
	};

	/*
	* e.g. addKeyframe(2, { opacity: 0.5 });
	*/
	Animation.prototype.addKeyframe = function (sec, css) {
		if (!isNaN(sec)) {
			this._duration += sec;
			this._keyframes.push({
				time: sec,
				css: css
			}); 
		}
	};

	function init(elm, name, duration, keyframes, params) {
		// create keyframe definition
		var keepLastState = params['iteration-count'] % 2;
		var last = false;
		var def = '@keyframes key-' + name + ' { ';
		var len = keyframes.length;
		var dur = 0;
		for (var i = 0; i < len; i++) {
			var item = keyframes[i];
			var timing = dur + item.time;
			var percentage = timing / duration;
			var css = parseCss(item.css);
			def += percentage + '% {' + css + '}';
		}
		def += ' } ';
		// create animation
		var anim = '.' + name + ' { ';
		var config = {
			duration: duration + 's',
			name: 'key-' + name
		};
		for (var key in params) {
			config[key] = params[key];
		}
		for (var nameKey in config) {
			anim += 'animation-' + nameKey + ': ' + config[nameKey] + ';';
		}
		anim += ' } ';
		// append animation css to DOM
		var style = document.createElement('style');
		style.setAttribute('type', 'text/css');
		style.setAttribute('id', name);
		style.innerHTML = def + anim;
		document.head.appendChild(style);
		// set up time
	}

	function parseCss(css) {
		var res = '';
		for (var key in css){
			res += this.JsStyleToCss(key) + ': ' + styles[key] + '; ';
		}
		return res;
	}

	function cssToJsStyle(style) {
		var key = '-';
		var index = style.indexOf(key);
		while(index > -1){
			var head = style.substring(0, index);
			var middle = style.substring(index + 1, index + 2).toUpperCase();
			var tail = style.substring(index + 2);
			style = head + middle + tail;
			index = style.indexOf(key);
		}
		return style;
	}

}());

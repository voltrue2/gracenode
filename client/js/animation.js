/* frame based CSS3 animation */
/* Dependencies: EventEmitter.src.js */
window.__fanimation_id = 0;
window._FPS = 12; /* frames per second for global setting (default is the same as Flash default) */

function FrameAnimation (target, fps) {
	EventEmitter.call(this);
	this.target = target; /* target element */
	/* defaults */ 
	if (!window._FPS || isNaN(window._FPS)){
		window.__FPS = 12;
	}
	this.framerate = window._FPS;
	this.settings = {direction: 'normal', 'iteration-count': 1, 'timing-function': 'linear', delay: 0, keepLastState: true};
	this.keyframes = {};
	this.totalFrames = 0; /* this property is meant to be private */
	this.name = 'fanim' + window.__fanimation_id; /* this property is meant to be private */
	this.agents = ['-webkit-', '-moz-']; /* this property is meant to be private */
	this.timer = null; /* this property is meant to be private */
	this.targetClass = null; /* this property is meant to be private */ 
	this.lastStates = {}; /* this property is meant to be private */ 
	this.delay = 0; /* this property is meant to be private */ 
	this.durationPerFrame = 0; /* this property is meant to be private */
	this.stopped = false; /* this property is meant to be private */
	this.running = false;
	this.prevFrame = 0;
	/* over write frame rate */
	if (fps && !isNaN(fps)){
		this.framerate = fps;
	}
	if (this.target) {
		this.targetClass = this.target.className;
	}
	/* increment the global identifier */
	window.__fanimation_id++;
}

window.inherits(FrameAnimation, EventEmitter);

FrameAnimation.prototype.setTarget = function (target) {
	if (this.target) {
		this.clean();
	}
	this.target = target;
	this.targetClass = target.className;
};

/* adds a key frame */
/* frame: number, css: object(style syntax supports BOTH css AND JavaScript) */
/* e.g. addKeyframe(10, {opacity: 0.5}) = opacity = 0.5 at frame 10 */
FrameAnimation.prototype.addKeyFrame = function (frame, css) {
	if (!isNaN(frame)){
		this.keyframes[frame] = css;
		this.totalFrames += frame - this.prevFrame;
		this.prevFrame = frame;
	}
	else {
		console.error('Animation.addKeyframe: Argument 1 needs to be a number', frame, css);
	}
};

/* delay uses frames */
/* params.direction, params.iteration, params.easing, params.delay, params.fps */
FrameAnimation.prototype.setup = function (params) {
	if (params.direction){
		this.settings['direction'] = params.direction;
	}
	if (params.iteration != undefined){
		if (params.iteration <= 0){
			params.iteration = 'infinite';
		}
		this.settings['iteration-count'] = params.iteration;
	}
	if (params.easing){
		this.settings['timing-function'] = params.easing;
	}
	if (params.delay){
		this.calcDurationPerFrame();
		this.settings['delay'] = params.delay;
		this.delay = params.delay * this.durationPerFrame;
	}
	if (params.keepLastState != undefined) {
		this.settings['keepLastState'] = params.keepLastState;
	}
	if (params.fps){
		this.framerate = params.fps;
	}
};

/* Callback on animation start */
FrameAnimation.prototype.onStart = function () {

};

/* Callback on animation finish (after clean up) */
FrameAnimation.prototype.onFinish = function () {

};

FrameAnimation.prototype.start = function () {
	this.initialize();
	if (typeof this.onStart == 'function'){
		this.onStart();
	}
};

FrameAnimation.prototype.reverse = function () {
	this.initialize('reverse');
};

FrameAnimation.prototype.stop = function () {
	if (this.stopped) {
		return;
	}
	// set the last state
	if (this.settings.keepLastState) {
		for (var name in this.lastStates){
			this.target.style[name] = this.lastStates[name];
		}
	}
	var self = this;
	window.setTimeout(function () {
		self.stopped = true;
		self.clean();
		self.running = false;
		if (typeof self.onFinish == 'function'){
			self.onFinish(self.name, self.target);
		}
		self.emit('stop');
	}, 0);	
};

FrameAnimation.prototype.updateFrameRate = function (f) {
	if (!f){
		f = window._FPS;
	}
	this.framerate = f;
};

/* Private Method */
FrameAnimation.prototype.initialize = function (reverse) {
	this.stopped = false;
	this.running = true;
	if (reverse){
		reverse = 100;
	}
	// clean
	this.clean();
	// create the keyframe definition
	var keepLastStates = this.settings['iteration-count'] % 2;
	var def = '';
	var keyframes = this.keyframes;
	var total = this.totalFrames;
	var last = false;
	for (var i = 0; i < this.agents.length; i++){
		def += '@' + this.agents[i] + 'keyframes key' + this.name + ' {';
		for (var f in keyframes){
			/* calculte the frame position */
			if (f == 0){
				var frame = 0;
			}
			else {
				var frame = Math.floor((f / total) * 100);
			}
			if (reverse == 100){
				frame = reverse - frame;
			}
			last = this.parseStyles(keyframes[f], keepLastStates) + '}';
			def += ' ' + frame + '% { ' + last;
			if (frame == 100){
				last = false;
			}
		}
		if (last && reverse != 100){
			def += ' 100% { ' + last;
		}
		else if (last && reverse == 100){
			def += ' 0% { ' + last;
		}
		def += ' } ';
	}
	// create the animation duration
	this.calcDurationPerFrame();
	var dur = total * this.durationPerFrame;
	this.settings['duration'] = dur + 'ms';
	this.settings['delay'] = this.delay + 'ms';
	this.settings['name'] = 'key' + this.name;
	var settings = this.settings;
	var anim = '.' + this.name + ' { ';
	for (var i = 0; i < this.agents.length; i++){
		for (var name in this.settings){
			anim += this.agents[i] + 'animation-' + name + ': ' + this.settings[name] + '; ';
		}
	}
	anim += '}';
	// append to the DOM document
	var css = document.createElement('style');
	css.setAttribute('type', 'text/css');
	css.setAttribute('id', this.name);
	css.innerHTML = def + ' ' + anim;
	document.head.appendChild(css);
	// start the animation
	this.target.className = this.targetClass + ' ' + this.name;
	// set up timer for callback
	if (!isNaN(this.settings['iteration-count']) && !this.timer){
		var self = this;
		this.timer = window.setTimeout(function () {
			self.stop();
		}, (dur * this.settings['iteration-count']) + this.delay);
	}
	var self = this;
	window.setTimeout(function () {
		if (reverse){
			self.emit('reverse');
		} else {
			self.emit('start');
		}
		self.emit('initialize');
	}, 0);
};

/* Private Method */
FrameAnimation.prototype.clean = function () {
	this.prevFrame = 0;
	this.lastStates = {};
	this.clearTimer();
	this.target.className = this.targetClass;
	var element = document.getElementById(this.name);
	if (element){
		element.parentNode.removeChild(element);
	}	
};

/* Private Method */
FrameAnimation.prototype.clearTimer = function () {
	window.clearTimeout(this.timer);
	this.timer = null;
};

FrameAnimation.prototype.calcDurationPerFrame = function () {
	this.durationPerFrame = Math.floor(1000 / this.framerate);
};

/* Private Method */
FrameAnimation.prototype.parseStyles = function (styles, keepLastStates) {
	var res = '';
	for (var key in styles){
		res += this.JsStyleToCss(key) + ': ' + styles[key] + '; ';
		if (keepLastStates){
			this.lastStates[this.cssStyleToJsStyle(key)] = styles[key];
		}
	}
	return res;
};

/* Private Method */
FrameAnimation.prototype.JsStyleToCss = function (style) {
	var m = style.match(/[A-Z]/g);
	if (m){
		var len = m.length;
		for (var i = 0; i < len; i++){
			style = style.replace(m[i], '-' + m[i].toLowerCase());
		}
	}
	return style;
};

/* Private Method */
FrameAnimation.prototype.cssStyleToJsStyle = function (style){
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
};

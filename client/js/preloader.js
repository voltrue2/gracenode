(function () {

function Preloader() {
	window.EventEmitter.call(this);
}

window.inherits(Preloader, window.EventEmitter);

Preloader.prototype.img = function (imageList, cb) {
	// create a copy to avoid poisining the original list
	var list = imageList.map(function (item) {
		return item;
	});
	var that = this;
	var img = new Image();
	img.addEventListener('abort', function (event) {
		that.emit('abort', event);
	});
	img.addEventListener('error', function (event) {
		that.emit('error', event);
	});
	img.addEventListener('load', function (event) {
		that.emit('load', event, this.src);
		var next = list.shift();
		if (next) {
			this.src = next;
		} else {
			// everything has been loaded
			that.emit('finished');
			if (typeof cb === 'function') {
				cb();
			}
		}
	});
	// load the first image
	this.emit('start');
	img.src = list.shift();
};

window.preloader = new Preloader();

}());

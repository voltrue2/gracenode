(function () {

function Chart(target, size, xAxis, yAxis, data) {
	this._offset = 2; // border
	this._width = 200;
	this._height = 100;	
	this._labelSizeX = 100;
	this._labelSizeY = 20;
	this._xAxis = {};
	this._yAxis = {};
	this._data = data;
	this._originalData = {
		width: size.width,
		height: size.height,
		xAxis: xAxis,
		yAxis: yAxis,
		data: data
	};
	this._chartStyle = 'line';
	var that = this;
	// reset button
	var reset = document.createElement('div');
	target.appendChild(reset);
	reset.style.border = '2px solid #ccc';
	reset.style.textAlign = 'center';
	reset.style.padding = '4px';
	reset.style.margin = '4px';
	reset.style.borderRadius = '4px';
	reset.style.width = '60px';
	reset.style.cursor = 'pointer';
	reset.textContent = 'Reset';
	reset.addEventListener('click', function () {
		that.reset();
	}, true);
	// create canvas
	this._canvas = document.createElement('canvas');
	this._context = this._canvas.getContext('2d');
	var container = document.createElement('div');
	container.style.WebkitUserSelect = 'none';
	container.style.WebkitTouchCallout = 'none';
	container.style.MozUserSelect = 'none';
	container.style.MsUserSelect = 'none';
	container.style.userSelect = 'none';
	target.appendChild(container);
	container.appendChild(this._canvas);
	// start building the interface
	this._setSize(size.width, size.height);
	this._setMeasure(xAxis, yAxis);
	this._create(data);
	// hover pointer and selecter
	var anchor = null;
	var selector = null;
	var hover = document.createElement('div');
	container.appendChild(hover);
	hover.style.display = 'none';
	hover.style.textAlign = 'right';
	hover.style.minWidth = '100px';
	hover.style.height = '40px';
	hover.style.border = '2px solid #ccc';
	hover.style.background = 'rgba(0, 0, 0, 0.6)';
	hover.style.color = '#fff';
	hover.style.padding = '4px';
	hover.style.position = 'absolute';
	hover.style.WebkitBoxShadow = '3px 2px 6px #000';
	hover.style.MozBoxShadow = '3px 2px 6px #000';
	hover.style.boxShadow = '3px 2px 6px #000';
	hover.style.zIndex = 999;
	hover.style.WebkitBorderRadius = '0 10px 10px 10px';
	hover.style.MozBorderRadius = '0 10px 10px 10px';
	hover.style.borderRadius = '10px 10px 10px 0';
	hover.style.cursor = 'default';
	// mouse event listener
	that._canvas.addEventListener('mousedown', function (event) {
		if (selector) {
			return;
		}
		var valueX = Math.round(event.layerX * (that._xAxis.length / that._width)) + that._xAxis.offset;
		var valueY = that._yAxis.length - Math.round(event.layerY * (that._yAxis.length / that._height)) + that._yAxis.offset;
		anchor = {
			x: event.layerX,
			y: event.layerY,
			fromX: valueX,
			toY: valueY
		};
		selector = document.createElement('div');
		selector.style.background = 'rgba(50, 100, 255, 0.4)';
		selector.style.border = '1px solid #009';
		selector.style.position = 'absolute';
		selector.style.top = event.pageY + 'px';
		selector.style.left = event.pageX + 'px';
		container.appendChild(selector);

	}, true);
	that._canvas.addEventListener('mouseup', function (event) {
		anchor.toX = Math.round(event.layerX * (that._xAxis.length / that._width)) + that._xAxis.offset;
		anchor.fromY = that._yAxis.length - Math.round(event.layerY * (that._yAxis.length / that._height)) + that._yAxis.offset;
		var fromX, fromY, toX, toY;
		if (anchor.fromX > anchor.toX) {
			fromX = anchor.toX;
			toX = anchor.fromX;
		} else {
			fromX = anchor.fromX;
			toX = anchor.toX;
		}
		if (anchor.fromY > anchor.toY) {
			fromY = anchor.toY;
			toY = anchor.fromY;
		} else {
			fromY = anchor.fromY;
			toY = anchor.toY;
		}
		var intervalX = Math.floor((toX - fromX) / 6);
		var intervalY = Math.floor((toY - fromY) / 6);
		that.resizeWithRange(that._width, that._height, { interval: intervalX, lengthFrom: fromX, lengthTo: toX }, { interval: intervalY, lengthFrom: fromY, lengthTo: toY });
		// reset	
		anchor = null;
		if (selector) {
			container.removeChild(selector);
			selector = null;
		}
	}, true);
	document.body.addEventListener('mouseup', function () {
		if (selector) {
			container.removeChild(selector);
			selector = null;
			anchor = null;
		}
	});
	that._canvas.addEventListener('mousemove', function (event) {
		var valueX = Math.round(event.layerX * (that._xAxis.length / that._width)) + that._xAxis.offset;
		var valueY = that._yAxis.length - Math.round(event.layerY * (that._yAxis.length / that._height)) + that._yAxis.offset;
		
		if (valueX > that._xAxis.length + that._xAxis.offset || valueY < 0) {
			hover.style.display = 'none';
			return false;
		}
		
		// hover
		var html = '<table style="color: #fff; text-align: right;">';
		html += '<tr><td>' + (that._xAxis.label || '---') + '</td><td>' + valueX + '</td></tr>';
		html += '<tr><td>' + (that._yAxis.label || '---') + '</td><td>' + valueY + '</td></tr>';
		html += '</table>';
		hover.innerHTML = html;
		hover.style.display = '';
		hover.style.top = (event.pageY - 65) + 'px';
		hover.style.left = (event.pageX) + 15 + 'px';
	
		// selector
		if (anchor) {
			var width = event.layerX - anchor.x - 3;
			var height = event.layerY - anchor.y - 3;
			if (event.layerX < anchor.x) {
				selector.style.left = (event.pageX + 3) + 'px';
				width = anchor.x - event.layerX;
			}
			if (event.layerY < anchor.y) {
				selector.style.top = (event.pageY + 3) + 'px';
				height = anchor.y - event.layerY;
			}
			selector.style.width = width + 'px';
			selector.style.height = height + 'px';
		}

	}, true);
	this._canvas.addEventListener('mouseout', function () {
		hover.style.display = 'none';
	}, true);
}

window.Chart = Chart;

Chart.prototype.lineChart = function () {
	this._chartStyle = 'line';
	this.reset();
};

Chart.prototype.barChart = function () {
	this._chartStyle = 'bar';
	this.reset();
};

/*
* xRange: { interval: Number(optional), lengthFrom: Number, lengthTo: Number }
* yRange: { interval: Number(optional), lengthFrom: Number, lengthTo: Number } 
*/
Chart.prototype.resizeWithRange = function (width, height, xRange, yRange) {
	// reset
	this._restoreOriginal();
	// check for errors
	if (xRange.lengthTo - xRange.lengthFrom > this._xAxis.length) {
		return console.error('<error> xRange is exceeding the original length');
	}
	if (yRange.lengthTo - yRange.lengthFrom > this._yAxis.length) {
		return console.error('<error> yRange is exceeding the original length');
	}
	this._setSize(width, height);
	// extract data
	var subData = {};
	var xDist = xRange.lengthTo - xRange.lengthFrom;
	var yDist = yRange.lengthTo - yRange.lengthFrom;
	var xRatio = xDist / width;
	var yRatio = yDist / height;
	var xFrom = xRange.lengthFrom * xRatio;
	var yFrom = yRange.lengthFrom * yRatio;
	for (var key in this._data) {
		var graph = this._data[key];
		var dots = graph.dots || null;
		if (dots) {	
			subData[key] = { color: graph.color, dots: [] };
			for (var index = 0, indexLen = dots.length; index < indexLen; index++) {
				var x = dots[index][0];
				var y = dots[index][1];
				if (x >= xRange.lengthFrom && y >= yRange.lengthFrom) {
					subData[key].dots.push([x - xRange.lengthFrom, y - yRange.lengthFrom]);
				}
			}
		}
	}
	// extract xAxis and yAxis within the given range
	var xAxis = {
		interval: xRange.interval || this._xAxis.interval,
		prevInterval: this._xAxis.interval,
		length: xRange.lengthTo - xRange.lengthFrom,
		offset: xRange.lengthFrom,
		labels: this._xAxis.labels || null,
		label: this._xAxis.label || ''
	};
	var yAxis = {
		interval: yRange.interval || this._yAxis.interval,
		prevInterval: this._yAxis.interval,
		length: yRange.lengthTo - yRange.lengthFrom,
		offset: yRange.lengthFrom,
		labels: this._yAxis.labels || null,
		label: this._yAxis.label || ''
	};
	this._setSize(width, height);
	this._setMeasure(xAxis, yAxis);
	this._create(subData);
};

Chart.prototype.resize = function (width, height) {
	this._setSize(width, height);
	this._setMeasure(this._xAxis, this._yAxis);
	this._create(this._data);
};

Chart.prototype.reset = function () {
	this._restoreOriginal();
	this._setSize(this._width, this._height);
	this._setMeasure(this._xAxis, this._yAxis);
	this._create(this._data);
};

Chart.prototype._restoreOriginal = function () {
	this._width = this._originalData.width;
	this._height = this._originalData.height;
	this._xAxis = this._originalData.xAxis;
	this._yAxis = this._originalData.yAxis;
	this._data = this._originalData.data;
};

/*
* xAxis: { interval: Number, length: Number }
* yAxis: { interval: Number, length: Number }
*/
Chart.prototype._setMeasure = function (xAxis, yAxis) {
	var xRatio =  xAxis.interval / xAxis.length;
	this._xAxis = {
		interval: xAxis.interval,
		prevInterval: xAxis.prevInterval || 0,
		length: xAxis.length,
		ratio: xRatio,
		label: xAxis.label,
		labels: xAxis.labels || null,
		offset: xAxis.offset || 0
	};
	var yRatio = yAxis.interval / yAxis.length;
	this._yAxis = {
		interval:yAxis.interval,
		prevInterval: yAxis.prevInterval || 0,
		length: yAxis.length,
		ratio: yRatio,
		label: yAxis.label,
		labels: yAxis.labels || null,
		offset: yAxis.offset || 0
	};
};

Chart.prototype._setSize = function (w, h) {
	this._width = w;
	this._height = h;
	this._canvas.width = this._width + this._offset + this._labelSizeX;
	this._canvas.height = this._height + this._offset + this._labelSizeY;
};

Chart.prototype._create = function (data) {
	createBorder(this._context, this._width, this._height, this._offset);	
	createBg(this._context, this._width, this._height, this._offset);
	populate(this._context, this._width, this._height, this._xAxis, this._yAxis, data, this._chartStyle);
	// label area
	this._context.fillStyle = '#fff';
	this._context.fillRect(this._width + this._offset, 0, this._labelSizeX, this._height + this._offset);
	this._context.fillRect(0, this._height + this._offset, this._width + this._offset, this._labelSizeY);
	createGrid(this._context, this._width, this._height, this._xAxis, this._yAxis, this._offset);	
};

Chart.prototype.drawGraph = function (data) {
	populate(this._context, this._width, this._height, this._xAxis, this._yAxis, data, this._chartStyle);
};

function createBorder(ctx, w, h, offset) {
	ctx.fillStyle = '#333';
	ctx.fillRect(0, 0, w + offset, h + offset);
}

function createBg(ctx, w, h, offset) {
	var x = offset / 2;
	var y = x;
	// graph area
	var gradient = ctx.createLinearGradient(0, 0, w, h);
	gradient.addColorStop(0, '#ffffff');
	gradient.addColorStop(1, '#eeeeef');
	ctx.fillStyle = gradient;
	ctx.fillRect(x, y, w, h);
}

function createGrid(ctx, w, h, xAxis, yAxis, offsetSrc) {
	ctx.font = 'Verdana';
	var measureLen = 5;
	var measureSize = measureLen * 2;	
	// x axis
	var offset = offsetSrc / 2;
	var xNum = Math.round(xAxis.length / xAxis.interval);
	var xInterval = w / xNum;
	var height = h + offset;
	var yNum = Math.round(yAxis.length / yAxis.interval);
	var yInterval = h / yNum;
	var width = w + offset;
	var xLabelOffset = (xAxis.offset && xAxis.prevInterval) ? Math.floor(xAxis.offset / xAxis.prevInterval) : 0;
	var yLabelOffset = (yAxis.offset && yAxis.prevInterval) ? Math.floor(yAxis.offset / yAxis.prevInterval) : 0;
	for (var i = 0; i < xNum; i++) {
		var x = xInterval * i;
		if (x < w) {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
			ctx.fillRect(Math.floor(x), 0, 1, height + measureSize);
		}	
		// label
		ctx.fillStyle = '#333';
		if (xAxis.labels && xAxis.labels[i + xLabelOffset]) {
			ctx.fillText(xAxis.labels[i + xLabelOffset], x + 5, h + 10);
		} else {
			ctx.fillText((xAxis.label || '') + ( (xAxis.interval * i) + xAxis.offset ), x + 5, h + 10);
		}
	}
	// y axis
	for (var j = 0; j < yNum; j++) {
		var y = yInterval * j;
		if (y < h) {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
			ctx.fillRect(0, Math.floor(y), width + measureSize, 1);
		}
		// label
		ctx.fillStyle = '#333';
		if (yAxis.labels && yAxis.labels[j + yLabelOffset]) {
			ctx.fillText(yAxis.labels[j + yLabelOffset], w + 5, y + 10);
		} else {
			ctx.fillText((yAxis.label || '') + ( (yAxis.interval * (yNum - j)) + yAxis.offset ), w + 5, y + 10);
		}
	}
}

/*
data = {
	graph: {
		color: "rgba(255, 0, 0, 0.5)",
		dots: [
			[x, y], [x, y], [x, y]....
		]
		
	},
	graph: ...
};
*/ 
function populate(ctx, w, h, xAxis, yAxis, data, chartStyle) {
	var xRatio = xAxis.length / w;
	var yRatio = yAxis.length / h;
	var key = null;
	var graph = null;
	if (chartStyle === 'line') {
		for (key in data) {
			graph = data[key];
			drawLineGraph(ctx, xAxis, yAxis, w, h,  xRatio, yRatio, graph);
		}
	} else if (chartStyle === 'bar') {
		for (key in data) {
			graph = data[key];
			drawBarGraph(ctx, xAxis, yAxis, w, h,  xRatio, yRatio, graph);
		}
	
	}
}

function drawLineGraph(ctx, xAxis, yAxis, w, h,  xRatio, yRatio, data) {
	var dots = data.dots;
	var prevX = 0;
	var prevY = h;
	ctx.strokeStyle = data.color;
	for (var i = 0, len = dots.length; i < len; i++) {
		var x = Math.round(dots[i][0] / xRatio);
		var y = h - Math.round(dots[i][1] / yRatio);
		ctx.beginPath();
		ctx.moveTo(prevX, prevY);
		ctx.lineTo(x, y);
		ctx.stroke();
		prevX = x;
		prevY = y;	
	}
}

function drawBarGraph(ctx, xAxis, yAxis, w, h, xRatio, yRatio, data) {
	var dots = data.dots;
	var prevX = 0;
	var len = data.dots.length;
	ctx.fillStyle = data.color;
	for (var i = 0; i < len; i++) {
		var x = Math.round(dots[i][0] / xRatio);
		var y = h - Math.round(dots[i][1] / yRatio);
		ctx.fillRect(x, y + 1, x - prevX, h - y);
		prevX = x;
	}
	
}

}());

(function (){

/*
* targetElement: DOM
* size: { width: Number, height: Number }
* data: [ { color: HEX, percentage: Number, label: String }, { color: HEX, percentage: Number, label: String }... ]
*/
function PieChart(targetElm, size, data) {
	var container = drawChart(targetElm, size);
	var time = new Date().getTime();
	drawPies(container, size, data, time);
}

window.PieChart = PieChart;

function drawChart(elm, size) {
	var container = document.createElement('div');
	elm.appendChild(container);
	elm.style.height = size.height + 'px';
	setStyle(container, {
		width: size.width + 'px',
		height: size.height + 'px',
		background: '#fff',
		WebkitBorderRadius: (size.width / 2) + 'px',
		borderRadius: (size.width / 2) + 'px',
		border: '1px solid #666'
	});
	return container;
}

function drawPies(elm, size, data, time) {
	var prevRotation = 0;
	var top = (size.height * -1) + 1;
	var indent = size.width + 4;
	for (var i = 0, len = data.length; i < len; i++) {
		// check if percentage exceeds 50%
		if (data[i].percentage > 50) {
			var fifty = {
				color: data[i].color,
				percentage: 50
			};
			prevRotation = drawPie(elm, size, fifty, prevRotation, i, time);
			var leftOver = {
				color: data[i].color,
				percentage: data[i].percentage - 50
			};
			prevRotation = drawPie(elm, size, leftOver, prevRotation, i, time);
		} else {
			prevRotation = drawPie(elm, size, data[i], prevRotation, i, time);
		}
		// create label
		var label = document.createElement('div');
		label.id = i;
		elm.parentNode.appendChild(label);
		setStyle(label, {
			textShadow: '1px 1px 0 #000, -1px -1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000',
			fontSize: '12px',
			color: '#fff',
			position: 'relative',
			top: top + 'px',
			marginLeft: indent + 'px',
			background: 'rgba(0, 0, 0, 0.5)',
			padding: '2px',
			minWidth: '250px',
			cursor: 'pointer'
		});
		var percentage = data[i].percentage.toString().substring(0, 4);
		label.innerHTML = '<span style="color: ' + data[i].color + ';">● </span>' + percentage + '% ' + data[i].label;
		// mouse over/out
		label.onmouseover = function () {
			var index = this.id;
			var cls = '._pie_' + index + time;
			var pies = document.querySelectorAll(cls);
			if (pies) {
				for (var i = 0, len = pies.length; i < len; i++) {
					var pie = pies[i];
					pie.color = pie.style.background;
					pie.style.background = '#f96';
				}
			}
			this.style.opacity = 0.6;
		};
		label.onmouseout = function () {
			var index = this.id;
			var cls = '._pie_' + index + time;
			var pies = document.querySelectorAll(cls);
			if (pies) {
				for (var i = 0, len = pies.length; i < len; i++) {
					var pie = pies[i];
					pie.style.background = pie.color;
				}
			}
			this.style.opacity = 1;
		};
	}
}

// cannot draw over 50%
function drawPie(elm, size, pieData, prevRotation, index, time) {
	var anchor = 90;
	var offset = 25;
	var onePercent2Deg = anchor / offset;
	var rotate = (onePercent2Deg * pieData.percentage) - anchor;
	var sliceRotation = (prevRotation) ? anchor + prevRotation : 0;
	var slice = document.createElement('div');
	setStyle(slice, {
		position: 'absolute',
		width: size.width + 'px',
		height: size.height + 'px',
		WebkitBorderRadius: (size.width / 2) + 'px',
		MozBorderRadius: (size.width / 2) + 'px',
		borderRadius: (size.width / 2) + 'px',
		clip: 'rect(0, ' + size.width + 'px, '  + size.height + 'px, ' + (size.width / 2) + 'px)',
		WebkitTransform: 'rotate(' + sliceRotation + 'deg)',
		MozTransform: 'rotate(' + sliceRotation + 'deg)',
		transform: 'rotate(' + sliceRotation + 'deg)'
	});
	elm.appendChild(slice);
	var pie = document.createElement('div');
	pie.className = '_pie_' + index + time;
	setStyle(pie, {
		position: 'absolute',
		width: size.width + 'px',
		height: size.height + 'px',
		WebkitBorderRadius: (size.width / 2) + 'px',
		MozBorderRadius: (size.width / 2) + 'px',
		borderRadius: (size.width / 2) + 'px',
		background: pieData.color,
		width: size.width + 'px',
		height: size.height + 'px',
		WebkitTransform: 'rotate(' + rotate + 'deg)',
		MozTransform: 'rotate(' + rotate + 'deg)',
		transform: 'rotate(' + rotate + 'deg)',
		clip: 'rect(0, ' + size.width + 'px, ' + (size.height / 2) + 'px, 0)'
	});
	slice.appendChild(pie);

	return sliceRotation + rotate;
}

function setStyle(elm, styles) {
	for (var key in styles) {
		elm.style[key] = styles[key];
	}
}


}());

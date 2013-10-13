// Inheritence
(function (window) {
	window.inherits = function (Child, Parent) {
		Child.prototype = Object.create(Parent.prototype, {
			constructor: { value: Child, enumerable: false, writable: true, configurable: true }
		});
	};
}(window));

// EventEmitter
(function (window) {

var EventEmitter = null;

if (window.EventEmitter) {
	EventEmitter = window.EventEmitter;
} else {
	EventEmitter = function () {};
	window.EventEmitter = EventEmitter;
}

EventEmitter.prototype.on = function (event, fn, prioritize, thisObj) {
	if (typeof fn !== 'function') {
		console.warn('EventEmitter.on: expected a function.', fn, 'given for event', event);
		return false;
	}
	if (arguments.length < 4 && typeof prioritize === 'object') {
		thisObj = prioritize;
		prioritize = false;
	}
	// announce that there is a new event listener
	this.emit('newListener', event, fn);
	var handler = {
		fn: fn,
		thisObj: thisObj
	};
	var allHandlers = this.eventHandlers;
	if (!allHandlers) {
		// first event handler for this event
		this.eventHandlers = allHandlers = {};	
		allHandlers[event] = [handler];
		return true;
	}
	var eventHandlers = allHandlers[event];
	if (!eventHandlers) {
		// first event handler for this event type
		allHandlers[event] = [handler];
		return true;
	}
	if (prioritize) {
		eventHandlers.unshift(handler);
	} else {
		eventHandlers.push(handler);
	}
	return true;
};

EventEmitter.prototype.once = function (event, fn, prioritize, thisObj) {
	fn.once = 1 + (fn.once >>> 0);
	this.on(event, fn, prioritize);
};

EventEmitter.prototype.remove = function (event, fn) {
	if (!this.eventHandlers) {
		// no event to remove
		return false; 
	}
	var handlers = this.eventHandlers[event];
	if (handlers) {
		for (var i = handlers.length - 1; i >= 0; i--) {
			if (handlers[i].fn === fn) {
				handlers.splice(i, 1);
				this.emit('removeListener', event, fn);
				// removed
				return true;
			}
		}
	}
	// no event nor handler function matched
	return false;
};

EventEmitter.prototype.removeAll = function (event) {
	if (event) {
		// remove all handlers for an event
		delete this.eventHandlers[event];
	} else {
		// remove all hanlers for all events
		this.eventHandlers = null;
	}
};

EventEmitter.prototype.hasListener = function (event) {
	return (this.eventHandlers && this.eventHandlers[event] && this.eventHandlers[event].length > 0) ? true : false;
};

EventEmitter.prototype.emit = function (event) {
	if (!this.eventHandlers) {
		// no listeners
		return false;
	}
	var handlers = this.eventHandlers[event];
	if (!handlers) {
		// no listeners for event
		return false;
	}
	// copy handlers into a new array so that removal does not affect array length
	handlers = handlers.slice();
	var args = Array.apply(null, arguments);
	args.shift();
	for (var i = 0, len = handlers.length; i < len; i++) {
		var handler = handlers[i];
		if (!handler) {
			continue;
		}
		var fn = handler.fn;
		// execute an event handler
		var result = fn.apply(handler.thisObj || this, args);
		// check for "once"
		if (fn.once) {
			if (fn.once > 1) {
				fn.once -= 1;
			} else {
				delete fn.once;
			}
			this._removeEventHandler(event, handler);
		}
		if (result === false) {
			break;
		}
	}
};

EventEmitter.prototype._removeEventHandler = function (event, handler) {
	if (!this.eventHandlers) {
		return false;
	}
	var handlers = this.eventHandlers[event];
	if (handlers) {
		var index = handlers.indexOf(handler);
		if (index !== -1) {
			handlers.splice(index, 1);
			this.emit('removeListener', event, handler.fn);
			return true;
		}
	}
	return false;
}; 

}(window));

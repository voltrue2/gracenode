'use strict';

const TYPE_REGEX = /number|string|boolean/;

module.exports = clone;

function clone(obj) {
    if (TYPE_REGEX.test(typeof obj)) {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    var copy = (obj instanceof Array) ? [] : {};
    _walk(obj, copy);
    return copy;
}

function _walk(obj, copy) {
    for (var key in obj) {
        var value;
        var item = obj[key];
        if (item instanceof Date) {
            value = new Date(item.getTime());
            _add(copy, key, value);
        } else if (item instanceof Function) {
            value = item;
            _add(copy, key, value);
        } else if (item instanceof Array) {
            value = [];
            _add(copy, key, value);
            _walk(item, value);
        } else if (item instanceof Object) {
            value = {};
            _add(copy, key, value);
            _walk(item, value);
        } else {
            value = item;
            _add(copy, key, value);
        }
    }
}

function _add(copy, key, value) {
    if (copy instanceof Array) {
        copy.push(value);
        return;
    }
    copy[key] = value;
}


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
    var copy;
    var isArray = obj instanceof Array;
    if (isArray) {
        copy = [];
        _walkArr(obj, copy);
    } else {
        copy = {};
        _walkObj(obj, copy);
    }
    return copy;
}

function _walkArr(arr, copy) {
    for (var i = 0, len = arr.length; i < len; i++) {
        var item = arr[i];
        var value;
        if (item instanceof Date) {
            value = new Date(item.getTime());
        } else if (item instanceof Array) {
            value = [];
            _walkArr(item, value);
        } else if (item instanceof Object) {
            value = {};
            _walkObj(item, value);
        } else {
            value = item;
        }
        copy.push(value);
    }
}

function _walkObj(obj, copy) {
    for (var key in obj) {
        var item = obj[key];
        var value;
        if (item instanceof Date) {
            value = new Date(item.getTime());
        } else if (item instanceof Array) {
            value = [];
            _walkArr(item, value);
        } else if (item instanceof Object) {
            value = {};
            _walkObj(item, value);
        } else {
            value = item;
        }
        copy[key] = value;
    }
}


var list = process.argv;

module.exports = function (key) {
    for (var i = 0, len = list.length; i < len; i++) {
        if (list[i].indexOf(key) !== -1) {
            return list[i].replace(key + '=', '') === 'true' ? true : false;
        }
    }
    return false;
};

var assert = require('assert');

module.exports.GET = function (req, res) {
    var parameters = req.parameters ? req.parameters : null;
    var submit = req.query['\u9001\u4FE1'];
    assert(req.requestId || req.id);
    if (parameters === null) {
        parameters = [];
        for (var i in req.params) {
            parameters.push(req.params[i]);
        }
    }
    res.json({ '\u9001\u4FE1': submit, parameters: parameters });
};

exports.params = [
    'one',
    'two'
];

exports.GET = function (req, res) {
    var params = req.parameters || [];
    if (!params.length) {
        for (var i in req.params) {
            params.push(req.params[i]);
        }
    }
    res.json({ key: req.get ? req.get('key') : req.args.key, method: 'sub2/index', params: params });
};

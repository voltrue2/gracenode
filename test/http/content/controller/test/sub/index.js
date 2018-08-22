exports.GET = function (req, res) {
    var params = req.parameters;
    if (!params) {
        params = [];
        for (var i in req.params) {
            params.push(req.params[i]);
        }    
    }
    res.json({ key: req.get ? req.get('key') : req.args.key, method: 'index', params: params });
};

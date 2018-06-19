exports.GET = function (req, res) {
    var params = req.parameters;
    if (!params) {
        params = [];
        for (var i in req.params) {
            params.push(req.params[i]);
        }
    }
    res.json({ method: 'call', params: params });
};

exports.PATCH = function (req, res) {
    var data = req.data ? req.data('data') : req.body.data;
    res.json({ data: data });
};

module.exports.POST = function (req, res) {
    var list = req.data ? req.data('list', req.data('literal')) : req.body.list;
    res.json(list);
};

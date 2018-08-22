exports.expected = {
    id: function (value) {
        if (typeof value !== 'number') {
            return new Error('id must be a number');
        }
    },
    name: function (value) {
        if (typeof value !== 'string') {
            return new Error('name must be a string');
        }
    }
};

exports.GET = function (req, res) {
    if (req.args) {
        if (typeof req.query.id !== 'number') {
            return res.error(new Error('id must be a number'), 400);
        }
        if (typeof req.query.name !== 'string') {
            return res.error(new Error('name must be a string'), 400);
        }
    }
    res.json('ok');
};

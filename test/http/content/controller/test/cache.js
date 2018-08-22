exports.GET = function (req, res) {
    if (res.header) {
        res.header('Cache-Control', 'private, max-age=6000');
        res.header('Pragma', null);
        res.header('Vary', 'foo');
        res.header('Connection', 'close');
    } else {
        res.headers['Cache-Control'] = 'private, max-age=6000';
        res.headers.Pragma = null;
        res.headers.Vary = 'foo';
        res.headers.Connection = 'close';
    }
    res.json('hello');
};

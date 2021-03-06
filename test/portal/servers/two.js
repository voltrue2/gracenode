'use strict';

const gn = require('../../../index');
var logger;

gn.config({
    log: {
        console: true,
        color: true,
        level: 'sys >=',
        file: __dirname + '/logs/'
    },
    portal: {
        type: 'server-two',
        address: '127.0.0.1',
        port: 4000,
        relayLimit: 1,
        compress: false,
        announce: {
            host: '127.0.0.1',
            port: 6379,
            interval: 1000
        }
    },
    http: {
        host: '127.0.0.1',
        port: 8600
    }
});

gn.portal.onAnnounce(function () {
    gn.portal.setNodeValue('two-value-key', 'two-value-' + Date.now());
});

const remember = {};

gn.start(function () {
    gn.log.setPrefix('TWO');
    logger = gn.log.create();
    gn.portal.on(101, function (payload, cb) {
        logger.debug('event one2two handled', payload);
        remember.one2two = payload;
        cb(payload);
    });

});

gn.http.get('two2one', function (req, res) {
    const nodes = gn.portal.getNodes('server-one');
    if (!nodes.length) {
        return res.error(new Error('NoNodeFound'));
    }
    const data = JSON.parse(JSON.stringify(remember.one2two));
    data.str = 'two2one';
    //data.obj.bin = new Buffer(data.obj.bin.data);
    gn.portal.emit(gn.portal.UDP, 100, nodes, data);
    res.json({ message: 'OK' });
});


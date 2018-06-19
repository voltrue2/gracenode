var gn = require('../../src/gracenode');

gn.config({
    log: {
        console: true,
        level: '>= verbose'
    }
});
gn.config({
    cluster: {
        max: 1 
    }
});

gn.config({
    cluster: {
        max: 0
    },
    withConf: {
        value: 'foo'
    }
});

gn.use('async', require('../../lib/async'));

if (process.argv[2] && process.argv[3]) {
    gn.use(process.argv[2], process.argv[3]);
}

if (process.argv[4] && process.argv[5]) {
    gn.use(process.argv[4], process.argv[5]);
}

if (process.argv[6]) {
    gn.config({
        cluster: {
            max: 2
        }
    });
}

gn.start(function () {
    if (!gn.mod.async) {
        gn.stop(new Error('noAsync'));
    }
    if (gn.isMaster() && !gn.mod.async) {
        gn.stop(new Error('noAsyncOnMaster'));
    }
    setTimeout(function () {
        gn.stop();
    }, 1000);
});

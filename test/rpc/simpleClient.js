'use strict';

var async = require('../../lib/async');
var gn = require('../../src/gracenode');
var ce = new gn.lib.CryptoEngine();
var net = require('net');
var transport = gn.lib.packet;

function Client() {
    const that = this;
    this.logger = gn.log.create();
    this.parser = new transport.Stream();
    this.client = new net.Socket();
    this.client.on('close', function (data) {
        that.onClose(data);
    });
}

Client.prototype.onClose = function () {

};

Client.prototype.start = function (host, port, cb) {
    this.logger.debug('client connect to:', host, port);
    this.client.connect(port, host, cb);
};

Client.prototype.stop = function (cb) {
    this.logger.debug('client disconnect');
    this.client.end();
    setTimeout(cb, 1000);
};

Client.prototype.send = function (commandId, seq, msg, cb) {

    if (!(msg instanceof Buffer)) {
        msg = JSON.stringify(msg);
    }

    this.logger.debug('client sending', commandId, seq, msg);

    var packet = transport.createRequest(commandId, seq, msg);
    this.client.write(packet, cb);

};

Client.prototype.recvOnce = function (cb) {
    var that = this;
    this.client.once('data', _onData);
    this.client.once('close', _onClose);

    function _onData(packet) {
        that.client.removeAllListeners('close');
        var parsed = that.parser.parse(packet);
        var value = parsed[0].payload;
        try {
            value = JSON.parse(parsed[0].payload);
        } catch (e) {
            // do nothing
        }
        that.logger.debug('client received:', parsed, value);
        cb(value, parsed[0].status);
    }

    function _onClose() {
        that.client.removeAllListeners('data');
        cb(new Error('closed'));
    }

};

Client.prototype.recv = function (cb) {
    var seq = 0;
    var that = this;
    this.client.on('data', function (buffer) {
        var packets = transport.parse(buffer);
        for (var i = 0, len = packets.length; i < len; i++) {
            var packet = packets[i];
            if (!packet) {
                continue;
            }
            seq += 1;
            that.logger.debug('recv seq:', seq);
            packet = packet.payload;
            try {
                cb(JSON.parse(packet));
            } catch (e) {
                cb(e);
            }
        }
    });

};

Client.prototype.sendSecure = function (sid, cipher, commandId, seq, msg, cb) {
    var uuid = gn.lib.uuid.create(sid);
    var session = new Buffer(16 + 4);
    uuid.toBytes().copy(session, 0, 0, uuid.getByteLength());
    session.writeUInt32BE(seq, 16);
    var encrypted = ce.encrypt(
        cipher.cipherKey,
        cipher.cipherNonce,
        cipher.macKey,
        seq,
        new Buffer(JSON.stringify(msg))
    );
    var payload = Buffer.concat([ session, encrypted ]);
    this.logger.debug('sender seq:', seq);
    this.send(commandId, seq, payload, cb);
};

/***
dataList = [
    { command: <command ID>, seq: <sequence>, payload: <payload buffer>  },
    { ... }
];
**/
Client.prototype.batchSendSecure = function (sid, cipher, dataList, cb) {
    var uuid = gn.lib.uuid.create(sid);
    var session = new Buffer(16 + 4);
    for (var i = 0, len = dataList.length; i < len; i++) {
        session.fill(0);
        uuid.toBytes().copy(session, 0, 0, uuid.getByteLength());
        session.writeUInt32BE(dataList[i].seq, 16);
        var encrypted = ce.encrypt(
            cipher.cipherKey,
            cipher.cipherNonce,
            cipher.macKey,
            dataList[i].seq,
            new Buffer(JSON.stringify(dataList[i].payload))
        );
        dataList[i].payload = Buffer.concat([ session, encrypted ]);
    }
    var packed = transport.createBatchRequest(dataList);
    this.client.write(packed, cb);
};

Client.prototype.recvOnceSecure = function (cipher, cb) {
    var that = this;
    this.client.once('data', function (packet) {
        that.client.removeAllListeners('close');
        var parsed = that.parser.parse(packet);
        var value;
        try {
            var decrypted = ce.decrypt(
                cipher.cipherKey,
                cipher.cipherNonce,
                cipher.macKey,
                // packet from server does not care about seq
                0,
                parsed[0].payload
            );
            that.logger.debug('client received encrypted:', parsed[0].payload, '>>', decrypted);
            value = decrypted;
        } catch (e) {
            cb(e);
        }
        that.logger.debug('secure receive:', parsed, value, typeof value);
        try {
            value = JSON.parse(value);
            cb(value);
        } catch (e) {
            cb(value);
        }
    });
    this.client.once('close', function () {
        that.client.removeAllListeners('data');
        cb(new Error('closed'));
    });
};

Client.prototype.recvSecure = function (cipher, cb) {
    var that = this;
    this.client.on('data', function (packet) {
        that.client.removeAllListeners('close');
        var parsed = that.parser.parse(packet);
        var value;
        for (var i = 0, len = parsed.length; i < len; i++) {
            try {
                var decrypted = ce.decrypt(
                    cipher.cipherKey,
                    cipher.cipherNonce,
                    cipher.macKey,
                    // packet from server does not care about seq
                    0,
                    parsed[i].payload
                );
                that.logger.debug('client received encrypted:', parsed[i].payload, '>>', decrypted);
                value = decrypted;
            } catch (e) {
                cb(e);
            }
            that.logger.debug('secure receive:', parsed, value, typeof value);
            try {
                value = JSON.parse(value);
                cb(value);
            } catch (e) {
                cb(value);
            }
        }
    });
    this.client.on('close', function () {
        that.client.removeAllListeners('data');
        cb(new Error('closed'));
    });
};

Client.prototype.clearRecv = function () {
    this.client.removeAllListeners('data');
    this.client.removeAllListeners('close');
};

module.exports = Client;

'use strict';

const _Buffer = require('../../src/buffer');
const gn = require('../../src/gracenode');
// single command per packet
const version0 = require('./protocols/version0');
// multiple commands per packet
const version2 = require('./protocols/version2');

var logger;

// this value can be configured
var MAX_PAYLOAD_SIZE = 8000;

const PARSE_LOOP_THRESHOLD = 128;
const KEYWORD_RPC = 'rpc';
const KEYWORD_TEXT = 'text';
const KEYWORD_PROXY = 'PROXY';
const KEYWORD_PROXY_V1 = 'proxy_v1';

const ERR_UNKNOWN = '<UNKNOWN_PROTOCOL>';
const ERR_PV2_NOT_SUPPORTED = '<PROTOCOL_V2_NOT_SUPPORTED>';
const ERR_UNKNOWN_PV = '<UNKNOWN__PROTOCOL_VERSION>';
const ERR_PAYLOAD_MAX = '<PAYLOAD_SIZE_LIMIT_EXCEEDED>';
const ERR_BAD_MAGIC_SYMBOL = '<BAD_MAGIC_STOP_SYMBOL>';
const ERR_PARSE_LOOP = '<PARSER_CAUGHT_IN_LOOP>';

module.exports.setup = function __transportBinSetup() {
    logger = gn.log.create('transport.bin');
};

module.exports.ERR = {
    UNKNOWN: ERR_UNKNOWN,
    PV2_NOT_SUPPORTED: ERR_PV2_NOT_SUPPORTED,
    UNKNOWN_PV1: ERR_UNKNOWN,
    PAYLOAD_MAX: ERR_PAYLOAD_MAX,
    BAD_MAGIC_SYMBOL: ERR_BAD_MAGIC_SYMBOL
};

module.exports.KEYWORS = {
    RPC: KEYWORD_RPC,
    TEXT: KEYWORD_TEXT,
    PROXY: KEYWORD_PROXY,
    PROXY_V1: KEYWORD_PROXY_V1
};

module.exports.setMaxSize = function __transportBinSetMaxSize(val) {
    MAX_PAYLOAD_SIZE = val;
    version0.setup(MAX_PAYLOAD_SIZE);
    version2.setup(MAX_PAYLOAD_SIZE);
};

module.exports.getMaxPacketSize = function __transportBinGetMaxPacketSize() {
    return MAX_PAYLOAD_SIZE;
};

module.exports.parse = function __transportBinParse(buf) {
    var parsed;
    switch (getVersion(buf)) {
        case -1:
            // buf is empty
            return null;
        case version0.VERSION:
            parsed = version0.parse(buf);
            if (!parsed) {
                // incomplete packet
                return null;
            }
            return {
                protocolVersion: parsed.protocolVersion,
                type: parsed.type,
                consumedLength: parsed.consumedLength,
                payloads: [{
                    command: parsed.command,
                    status: parsed.status || null,
                    seq: parsed.seq,
                    payload: parsed.payload
                }]
            };
        case version2.VERSION:
            parsed = version2.parse(buf);
            if (!parsed) {
                // incomplete packet
                return null;
            }
            return {
                protocolVersion: parsed.protocolVersion,
                type: parsed.type,
                consumedLength: parsed.consumedLength,
                payloads: parsed.payloads
            };
        default:
            logger.error('Unknown protocol version:', gn.lib.showBuffer(buf));
            return new Error(ERR_UNKNOWN_PV);
    }
};

module.exports.createReply = function __transportBinCreateReply(status, seq, payload) {
    // this is always version 0
    return createReply(0, payload, status, seq);
};

module.exports.createPush = function __transportBinCreatePush(seq, payload) {
    // this is always version 0
    return createPush(0, seq, payload);
};

module.exports.createRequest = function __transportBinCreateRequest(commandId, seq, payload) {
    // this is always version 0
    return createRequest(0, commandId, payload, seq);
};

/***
dataList = [
    { command: <command ID>, seq: <sequence>, payload: <payload buffer> },
    { ... }
];
**/
module.exports.createBatchRequest = function __transportBinCreateBatchRequest(dataList) {
    // this is always version 10
    return version2.create(dataList);
};

function createRequest(version, command, payload, seq) {
    // request packet does not have status
    var status = 0;
    var packet = createReply(version, payload, status, seq);
    // add command to packet
    packet.writeUInt16BE(command, version0.OFFSET_CMD);
    return packet;
}

function createPush(version, seq, payload) {
    // push packet has no status
    var status = 0;
    var packet = createReply(version, payload, status, seq, 0);
    // push packet's reply flag = 0x00
    packet.writeUInt8(0x00, version0.OFFSET_REPLY_FLAG);
    return packet;
}

function createReply(version, _payload, status, seq) {
    var payload;
    if (_payload === null || _payload === undefined) {
        payload = '';
    } else if (typeof _payload === 'string' || Buffer.isBuffer(_payload)) {
        payload = _payload;
    } else {
        // buffer must be UTF-8 safe
        try {
            payload = _Buffer.alloc(JSON.stringify(_payload));
        } catch (e) {
            return new Error(e.message + ': ' + _payload);
        }
    }
    var packet = version0.create(payload, status, seq);
    return packet;
}

function getVersion(buf) {
    if (!buf.length) {
        return -1;
    }
    return buf.readUInt8(0);
}

function Stream() {
    this.buffer = null;
}

Stream.prototype.parse = function __transportStreamParse(buf) {
    if (!buf) {
        logger.verbose('stream buffer is missing');
        return null;
    }
    if (this.buffer) {
        this.buffer = Buffer.concat([ this.buffer, buf ]);
    } else {
        this.buffer = buf;
    }
    var parsedList = [];
    var parsed = this._parse();
    var loopCount = 0;
    
    // kill connection immediately
    if (parsed instanceof Error) {
        return parsed;
    }

    if (!parsed) {
        // not enough buffer
        return null;
    }

    parsedList = parsedList.concat(parsed.payloads);

    while (parsed) {
        parsed = this._parse();
        // kill connection immediately
        if (parsed instanceof Error) {
            return parsed;
        }
        if (parsed) {
            parsedList = parsedList.concat(parsed.payloads);
        }
        loopCount += 1;
        if (loopCount >= PARSE_LOOP_THRESHOLD) {
            logger.error('buffer parser is cought in loop:', loopCount, 'aborting and disconnect');
            return new Error(ERR_PARSE_LOOP);
        }
    }

    return parsedList;
};

Stream.prototype._parse = function __transportStreamUparse() {
    var parsed = module.exports.parse(this.buffer);
    if (!parsed) {
        return null;
    }
    if (parsed instanceof Error) {
        return parsed;
    }
    // free the amount of buffer parsed for this packet
    this.buffer = this.buffer.slice(parsed.consumedLength);
    // done
    return parsed;
};

// use either .parse() or lazyParse(): NEVER use both
Stream.prototype.lazyParse = function __transportStreamLazyParse(buf, cb) {
    if (!buf) {
        // no buffer given, but it is NOT an error
        return cb(null, null);
    }
    if (this.buffer) {
        this.buffer = Buffer.concat([ this.buffer, buf ]);
    } else {
        this.buffer = buf;
    }
    var parsedList = [];
    var that = this;
    var iterate = function __transportStreamLazyParseIterate() {
        var parsed = that._parse();
        if (!parsed) {
            // no more buffer to parse: done
            return cb(null, parsedList);
        }
        if (parsed instanceof Error) {
            // parse error: abort all parsing: we should disconnect at this point
            return cb(parsed);
        }
        // add parsed payloads to list
        parsedList = parsedList.concat(parsed.payloads);
        // try to parse more
        setImmediate(iterate);
    };
    // start parsing the buffer and iterate until done
    iterate();
};

module.exports.Stream = Stream;

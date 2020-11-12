"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bluebird_1 = __importDefault(require("bluebird"));
var debug_1 = __importDefault(require("debug"));
var dns_1 = __importDefault(require("dns"));
var lodash_1 = __importDefault(require("lodash"));
var net_1 = __importDefault(require("net"));
var tls_1 = __importDefault(require("tls"));
var debug = debug_1.default('cypress:network:connect');
function byPortAndAddress(port, address) {
    // https://nodejs.org/api/net.html#net_net_connect_port_host_connectlistener
    return new bluebird_1.default(function (resolve, reject) {
        var onConnect = function () {
            client.end();
            resolve(address);
        };
        var client = net_1.default.connect(port, address.address, onConnect);
        client.on('error', reject);
    });
}
exports.byPortAndAddress = byPortAndAddress;
function getAddress(port, hostname) {
    debug('beginning getAddress %o', { hostname: hostname, port: port });
    var fn = byPortAndAddress.bind({}, port);
    // promisify at the very last second which enables us to
    // modify dns lookup function (via hosts overrides)
    var lookupAsync = bluebird_1.default.promisify(dns_1.default.lookup, { context: dns_1.default });
    // this does not go out to the network to figure
    // out the addresess. in fact it respects the /etc/hosts file
    // https://github.com/nodejs/node/blob/dbdbdd4998e163deecefbb1d34cda84f749844a4/lib/dns.js#L108
    // https://nodejs.org/api/dns.html#dns_dns_lookup_hostname_options_callback
    // @ts-ignore
    return lookupAsync(hostname, { all: true })
        .then(function (addresses) {
        debug('got addresses %o', { hostname: hostname, port: port, addresses: addresses });
        // convert to an array if string
        return Array.prototype.concat.call(addresses).map(fn);
    })
        .tapCatch(function (err) {
        debug('error getting address %o', { hostname: hostname, port: port, err: err });
    })
        .any();
}
exports.getAddress = getAddress;
function getDelayForRetry(iteration) {
    return [0, 100, 200, 200][iteration];
}
exports.getDelayForRetry = getDelayForRetry;
function createSocket(opts, onConnect) {
    var netOpts = lodash_1.default.pick(opts, 'host', 'port');
    if (opts.useTls) {
        return tls_1.default.connect(netOpts, onConnect);
    }
    return net_1.default.connect(netOpts, onConnect);
}
function createRetryingSocket(opts, cb) {
    if (typeof opts.getDelayMsForRetry === 'undefined') {
        opts.getDelayMsForRetry = getDelayForRetry;
    }
    function tryConnect(iteration) {
        if (iteration === void 0) { iteration = 0; }
        var retry = function (err) {
            var delay = opts.getDelayMsForRetry(iteration, err);
            if (typeof delay === 'undefined') {
                debug('retries exhausted, bubbling up error %o', { iteration: iteration, err: err });
                return cb(err);
            }
            debug('received error on connect, retrying %o', { iteration: iteration, delay: delay, err: err });
            setTimeout(function () {
                tryConnect(iteration + 1);
            }, delay);
        };
        function onError(err) {
            sock.on('error', function (err) {
                debug('second error received on retried socket %o', { opts: opts, iteration: iteration, err: err });
            });
            retry(err);
        }
        function onConnect() {
            debug('successfully connected %o', { opts: opts, iteration: iteration });
            // connection successfully established, pass control of errors/retries to consuming function
            sock.removeListener('error', onError);
            cb(undefined, sock, retry);
        }
        var sock = createSocket(opts, onConnect);
        sock.once('error', onError);
    }
    tryConnect();
}
exports.createRetryingSocket = createRetryingSocket;

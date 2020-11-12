"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var http_1 = __importDefault(require("http"));
var https_1 = __importDefault(require("https"));
var lodash_1 = __importDefault(require("lodash"));
var net_1 = __importDefault(require("net"));
var proxy_from_env_1 = require("proxy-from-env");
var url_1 = __importDefault(require("url"));
var connect_1 = require("./connect");
var debug = debug_1.default('cypress:network:agent');
var CRLF = '\r\n';
var statusCodeRe = /^HTTP\/1.[01] (\d*)/;
function buildConnectReqHead(hostname, port, proxy) {
    var connectReq = ["CONNECT " + hostname + ":" + port + " HTTP/1.1"];
    connectReq.push("Host: " + hostname + ":" + port);
    if (proxy.auth) {
        connectReq.push("Proxy-Authorization: basic " + Buffer.from(proxy.auth).toString('base64'));
    }
    return connectReq.join(CRLF) + lodash_1.default.repeat(CRLF, 2);
}
exports.buildConnectReqHead = buildConnectReqHead;
exports.createProxySock = function (opts, cb) {
    if (opts.proxy.protocol !== 'https:' && opts.proxy.protocol !== 'http:') {
        return cb(new Error("Unsupported proxy protocol: " + opts.proxy.protocol));
    }
    var isHttps = opts.proxy.protocol === 'https:';
    var port = opts.proxy.port || (isHttps ? 443 : 80);
    var connectOpts = {
        port: Number(port),
        host: opts.proxy.hostname,
        useTls: isHttps,
    };
    if (!opts.shouldRetry) {
        connectOpts.getDelayMsForRetry = function () { return undefined; };
    }
    connect_1.createRetryingSocket(connectOpts, function (err, sock, triggerRetry) {
        if (err) {
            return cb(err);
        }
        cb(undefined, sock, triggerRetry);
    });
};
exports.isRequestHttps = function (options) {
    // WSS connections will not have an href, but you can tell protocol from the defaultAgent
    return lodash_1.default.get(options, '_defaultAgent.protocol') === 'https:' || (options.href || '').slice(0, 6) === 'https';
};
exports.isResponseStatusCode200 = function (head) {
    // read status code from proxy's response
    var matches = head.match(statusCodeRe);
    return lodash_1.default.get(matches, 1) === '200';
};
exports.regenerateRequestHead = function (req) {
    delete req._header;
    req._implicitHeader();
    if (req.output && req.output.length > 0) {
        // the _header has already been queued to be written to the socket
        var first = req.output[0];
        var endOfHeaders = first.indexOf(lodash_1.default.repeat(CRLF, 2)) + 4;
        req.output[0] = req._header + first.substring(endOfHeaders);
    }
};
var getFirstWorkingFamily = function (_a, familyCache, cb) {
    // this is a workaround for localhost (and potentially others) having invalid
    // A records but valid AAAA records. here, we just cache the family of the first
    // returned A/AAAA record for a host that we can establish a connection to.
    // https://github.com/cypress-io/cypress/issues/112
    var port = _a.port, host = _a.host;
    var isIP = net_1.default.isIP(host);
    if (isIP) {
        // isIP conveniently returns the family of the address
        return cb(isIP);
    }
    if (process.env.HTTP_PROXY) {
        // can't make direct connections through the proxy, this won't work
        return cb();
    }
    if (familyCache[host]) {
        return cb(familyCache[host]);
    }
    return connect_1.getAddress(port, host)
        .then(function (firstWorkingAddress) {
        familyCache[host] = firstWorkingAddress.family;
        return cb(firstWorkingAddress.family);
    })
        .catch(function () {
        return cb();
    });
};
var CombinedAgent = /** @class */ (function () {
    function CombinedAgent(httpOpts, httpsOpts) {
        if (httpOpts === void 0) { httpOpts = {}; }
        if (httpsOpts === void 0) { httpsOpts = {}; }
        this.familyCache = {};
        this.httpAgent = new HttpAgent(httpOpts);
        this.httpsAgent = new HttpsAgent(httpsOpts);
    }
    // called by Node.js whenever a new request is made internally
    CombinedAgent.prototype.addRequest = function (req, options, port, localAddress) {
        var _this = this;
        // allow requests which contain invalid/malformed headers
        // https://github.com/cypress-io/cypress/issues/5602
        req.insecureHTTPParser = true;
        // Legacy API: addRequest(req, host, port, localAddress)
        // https://github.com/nodejs/node/blob/cb68c04ce1bc4534b2d92bc7319c6ff6dda0180d/lib/_http_agent.js#L148-L155
        if (typeof options === 'string') {
            // @ts-ignore
            options = {
                host: options,
                port: port,
                localAddress: localAddress,
            };
        }
        var isHttps = exports.isRequestHttps(options);
        if (!options.href) {
            // options.path can contain query parameters, which url.format will not-so-kindly urlencode for us...
            // so just append it to the resultant URL string
            options.href = url_1.default.format({
                protocol: isHttps ? 'https:' : 'http:',
                slashes: true,
                hostname: options.host,
                port: options.port,
            }) + options.path;
            if (!options.uri) {
                options.uri = url_1.default.parse(options.href);
            }
        }
        debug('addRequest called %o', __assign({ isHttps: isHttps }, lodash_1.default.pick(options, 'href')));
        return getFirstWorkingFamily(options, this.familyCache, function (family) {
            options.family = family;
            debug('got family %o', lodash_1.default.pick(options, 'family', 'href'));
            if (isHttps) {
                return _this.httpsAgent.addRequest(req, options);
            }
            _this.httpAgent.addRequest(req, options);
        });
    };
    return CombinedAgent;
}());
exports.CombinedAgent = CombinedAgent;
var HttpAgent = /** @class */ (function (_super) {
    __extends(HttpAgent, _super);
    function HttpAgent(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = this;
        opts.keepAlive = true;
        _this = _super.call(this, opts) || this;
        // we will need this if they wish to make http requests over an https proxy
        _this.httpsAgent = new https_1.default.Agent({ keepAlive: true });
        return _this;
    }
    HttpAgent.prototype.addRequest = function (req, options) {
        if (process.env.HTTP_PROXY) {
            var proxy = proxy_from_env_1.getProxyForUrl(options.href);
            if (proxy) {
                options.proxy = proxy;
                return this._addProxiedRequest(req, options);
            }
        }
        _super.prototype.addRequest.call(this, req, options);
    };
    HttpAgent.prototype._addProxiedRequest = function (req, options) {
        debug("Creating proxied request for " + options.href + " through " + options.proxy);
        var proxy = url_1.default.parse(options.proxy);
        // set req.path to the full path so the proxy can resolve it
        // @ts-ignore: Cannot assign to 'path' because it is a constant or a read-only property.
        req.path = options.href;
        delete req._header; // so we can set headers again
        req.setHeader('host', options.host + ":" + options.port);
        if (proxy.auth) {
            req.setHeader('proxy-authorization', "basic " + Buffer.from(proxy.auth).toString('base64'));
        }
        // node has queued an HTTP message to be sent already, so we need to regenerate the
        // queued message with the new path and headers
        // https://github.com/TooTallNate/node-http-proxy-agent/blob/master/index.js#L93
        exports.regenerateRequestHead(req);
        options.port = Number(proxy.port || 80);
        options.host = proxy.hostname || 'localhost';
        delete options.path; // so the underlying net.connect doesn't default to IPC
        if (proxy.protocol === 'https:') {
            // gonna have to use the https module to reach the proxy, even though this is an http req
            req.agent = this.httpsAgent;
            return this.httpsAgent.addRequest(req, options);
        }
        _super.prototype.addRequest.call(this, req, options);
    };
    return HttpAgent;
}(http_1.default.Agent));
var HttpsAgent = /** @class */ (function (_super) {
    __extends(HttpsAgent, _super);
    function HttpsAgent(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = this;
        opts.keepAlive = true;
        _this = _super.call(this, opts) || this;
        return _this;
    }
    HttpsAgent.prototype.createConnection = function (options, cb) {
        if (process.env.HTTPS_PROXY) {
            var proxy = proxy_from_env_1.getProxyForUrl(options.href);
            if (proxy) {
                options.proxy = proxy;
                return this.createUpstreamProxyConnection(options, cb);
            }
        }
        // @ts-ignore
        cb(null, _super.prototype.createConnection.call(this, options));
    };
    HttpsAgent.prototype.createUpstreamProxyConnection = function (options, cb) {
        var _this = this;
        // heavily inspired by
        // https://github.com/mknj/node-keepalive-proxy-agent/blob/master/index.js
        debug("Creating proxied socket for " + options.href + " through " + options.proxy);
        var proxy = url_1.default.parse(options.proxy);
        var port = options.uri.port || '443';
        var hostname = options.uri.hostname || 'localhost';
        exports.createProxySock({ proxy: proxy, shouldRetry: options.shouldRetry }, function (originalErr, proxySocket, triggerRetry) {
            if (originalErr) {
                var err = new Error("A connection to the upstream proxy could not be established: " + originalErr.message);
                err.originalErr = originalErr;
                err.upstreamProxyConnect = true;
                return cb(err, undefined);
            }
            var onClose = function () {
                triggerRetry(new Error('ERR_EMPTY_RESPONSE: The upstream proxy closed the socket after connecting but before sending a response.'));
            };
            var onError = function (err) {
                triggerRetry(err);
                proxySocket.destroy();
            };
            var buffer = '';
            var onData = function (data) {
                debug("Proxy socket for " + options.href + " established");
                buffer += data.toString();
                if (!lodash_1.default.includes(buffer, lodash_1.default.repeat(CRLF, 2))) {
                    // haven't received end of headers yet, keep buffering
                    proxySocket.once('data', onData);
                    return;
                }
                // we've now gotten enough of a response not to retry
                // connecting to the proxy
                proxySocket.removeListener('error', onError);
                proxySocket.removeListener('close', onClose);
                if (!exports.isResponseStatusCode200(buffer)) {
                    return cb(new Error("Error establishing proxy connection. Response from server was: " + buffer), undefined);
                }
                if (options._agentKey) {
                    // https.Agent will upgrade and reuse this socket now
                    options.socket = proxySocket;
                    // as of Node 12, a ServerName cannot be an IP address
                    // https://github.com/cypress-io/cypress/issues/5729
                    if (!net_1.default.isIP(hostname)) {
                        options.servername = hostname;
                    }
                    return cb(undefined, _super.prototype.createConnection.call(_this, options, undefined));
                }
                cb(undefined, proxySocket);
            };
            proxySocket.once('close', onClose);
            proxySocket.once('error', onError);
            proxySocket.once('data', onData);
            var connectReq = buildConnectReqHead(hostname, port, proxy);
            proxySocket.setNoDelay(true);
            proxySocket.write(connectReq);
        });
    };
    return HttpsAgent;
}(https_1.default.Agent));
var agent = new CombinedAgent();
exports.default = agent;

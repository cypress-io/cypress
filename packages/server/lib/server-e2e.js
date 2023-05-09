"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerE2E = void 0;
const tslib_1 = require("tslib");
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const is_html_1 = tslib_1.__importDefault(require("is-html"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const stream_1 = tslib_1.__importDefault(require("stream"));
const url_1 = tslib_1.__importDefault(require("url"));
const https_proxy_1 = tslib_1.__importDefault(require("@packages/https-proxy"));
const net_stubbing_1 = require("@packages/net-stubbing");
const network_1 = require("@packages/network");
const makeGraphQLServer_1 = require("@packages/graphql/src/makeGraphQLServer");
const errors = tslib_1.__importStar(require("./errors"));
const file_server_1 = tslib_1.__importDefault(require("./file_server"));
const server_base_1 = require("./server-base");
const app_data_1 = tslib_1.__importDefault(require("./util/app_data"));
const ensureUrl = tslib_1.__importStar(require("./util/ensure-url"));
const headers_1 = tslib_1.__importDefault(require("./util/headers"));
const status_code_1 = tslib_1.__importDefault(require("./util/status_code"));
const fullyQualifiedRe = /^https?:\/\//;
const htmlContentTypesRe = /^(text\/html|application\/xhtml)/i;
const debug = (0, debug_1.default)('cypress:server:server-e2e');
const isResponseHtml = function (contentType, responseBuffer) {
    if (contentType) {
        // want to match anything starting with 'text/html'
        // including 'text/html;charset=utf-8' and 'Text/HTML'
        // https://github.com/cypress-io/cypress/issues/8506
        return htmlContentTypesRe.test(contentType);
    }
    const body = lodash_1.default.invoke(responseBuffer, 'toString');
    if (body) {
        return (0, is_html_1.default)(body);
    }
    return false;
};
class ServerE2E extends server_base_1.ServerBase {
    constructor() {
        super();
        // the initialization of this variable is only precautionary as the actual config value is applied when the server is created
        this.skipDomainInjectionForDomains = null;
        this._urlResolver = null;
    }
    open(config, options) {
        return super.open(config, { ...options, testingType: 'e2e' });
    }
    createServer(app, config, onWarning) {
        return new bluebird_1.default((resolve, reject) => {
            const { port, fileServerFolder, socketIoRoute, baseUrl, experimentalSkipDomainInjection } = config;
            this._server = this._createHttpServer(app);
            this.skipDomainInjectionForDomains = experimentalSkipDomainInjection;
            const onError = (err) => {
                // if the server bombs before starting
                // and the err no is EADDRINUSE
                // then we know to display the custom err message
                if (err.code === 'EADDRINUSE') {
                    return reject(this.portInUseErr(port));
                }
            };
            debug('createServer connecting to server');
            this.server.on('connect', this.onConnect.bind(this));
            this.server.on('upgrade', (req, socket, head) => this.onUpgrade(req, socket, head, socketIoRoute));
            this.server.once('error', onError);
            this._graphqlWS = (0, makeGraphQLServer_1.graphqlWS)(this.server, `${socketIoRoute}-graphql`);
            return this._listen(port, (err) => {
                // if the server bombs before starting
                // and the err no is EADDRINUSE
                // then we know to display the custom err message
                if (err.code === 'EADDRINUSE') {
                    return reject(this.portInUseErr(port));
                }
            })
                .then((port) => {
                return bluebird_1.default.all([
                    https_proxy_1.default.create(app_data_1.default.path('proxy'), port, {
                        onRequest: this.callListeners.bind(this),
                        onUpgrade: this.onSniUpgrade.bind(this),
                    }),
                    file_server_1.default.create(fileServerFolder),
                ])
                    .spread((httpsProxy, fileServer) => {
                    this._httpsProxy = httpsProxy;
                    this._fileServer = fileServer;
                    // if we have a baseUrl let's go ahead
                    // and make sure the server is connectable!
                    if (baseUrl) {
                        this._baseUrl = baseUrl;
                        if (config.isTextTerminal) {
                            return this._retryBaseUrlCheck(baseUrl, onWarning)
                                .return(null)
                                .catch((e) => {
                                debug(e);
                                return reject(errors.get('CANNOT_CONNECT_BASE_URL'));
                            });
                        }
                        return ensureUrl.isListening(baseUrl)
                            .return(null)
                            .catch((err) => {
                            debug('ensuring baseUrl (%s) errored: %o', baseUrl, err);
                            return errors.get('CANNOT_CONNECT_BASE_URL_WARNING', baseUrl);
                        });
                    }
                }).then((warning) => {
                    // once we open set the domain to root by default
                    // which prevents a situation where navigating
                    // to http sites redirects to /__/ cypress
                    this._remoteStates.set(baseUrl != null ? baseUrl : '<root>');
                    return resolve([port, warning]);
                });
            });
        });
    }
    startWebsockets(automation, config, options = {}) {
        options.onResolveUrl = this._onResolveUrl.bind(this);
        return super.startWebsockets(automation, config, options);
    }
    _onResolveUrl(urlStr, headers, automationRequest, options = { headers: {} }) {
        var _a;
        let p;
        debug('resolving visit %o', {
            url: urlStr,
            headers,
            options,
        });
        // always clear buffers - reduces the possibility of a random HTTP request
        // accidentally retrieving buffered content at the wrong time
        (_a = this._networkProxy) === null || _a === void 0 ? void 0 : _a.reset();
        const startTime = Date.now();
        // if we have an existing url resolver
        // in flight then cancel it
        if (this._urlResolver) {
            this._urlResolver.cancel();
        }
        const request = this.request;
        let handlingLocalFile = false;
        const previousRemoteState = this._remoteStates.current();
        const previousRemoteStateIsPrimary = this._remoteStates.isPrimarySuperDomainOrigin(previousRemoteState.origin);
        const primaryRemoteState = this._remoteStates.getPrimary();
        // nuke any hashes from our url since
        // those those are client only and do
        // not apply to http requests
        urlStr = url_1.default.parse(urlStr);
        urlStr.hash = null;
        urlStr = urlStr.format();
        const originalUrl = urlStr;
        let reqStream = null;
        let currentPromisePhase = null;
        const runPhase = (fn) => {
            return currentPromisePhase = fn();
        };
        const matchesNetStubbingRoute = (requestOptions) => {
            var _a;
            const proxiedReq = {
                proxiedUrl: requestOptions.url,
                resourceType: 'document',
                ...lodash_1.default.pick(requestOptions, ['headers', 'method']),
                // TODO: add `body` here once bodies can be statically matched
            };
            // @ts-ignore
            const iterator = (0, net_stubbing_1.getRoutesForRequest)((_a = this.netStubbingState) === null || _a === void 0 ? void 0 : _a.routes, proxiedReq);
            // If the iterator is exhausted (done) on the first try, then 0 matches were found
            const zeroMatches = iterator.next().done;
            return !zeroMatches;
        };
        return this._urlResolver = (p = new bluebird_1.default((resolve, reject, onCancel) => {
            var _a;
            let urlFile;
            onCancel === null || onCancel === void 0 ? void 0 : onCancel(() => {
                p.currentPromisePhase = currentPromisePhase;
                p.reqStream = reqStream;
                lodash_1.default.invoke(reqStream, 'abort');
                return lodash_1.default.invoke(currentPromisePhase, 'cancel');
            });
            const redirects = [];
            let newUrl = null;
            if (!fullyQualifiedRe.test(urlStr)) {
                handlingLocalFile = true;
                options.headers['x-cypress-authorization'] = (_a = this._fileServer) === null || _a === void 0 ? void 0 : _a.token;
                const state = this._remoteStates.set(urlStr, options);
                // TODO: Update url.resolve signature to not use deprecated methods
                urlFile = url_1.default.resolve(state.fileServer, urlStr);
                urlStr = url_1.default.resolve(state.origin, urlStr);
            }
            const onReqError = (err) => {
                // only restore the previous state
                // if our promise is still pending
                if (p.isPending()) {
                    restorePreviousRemoteState(previousRemoteState, previousRemoteStateIsPrimary);
                }
                return reject(err);
            };
            const onReqStreamReady = (str) => {
                reqStream = str;
                return str
                    .on('error', onReqError)
                    .on('response', (incomingRes) => {
                    debug('resolve:url headers received, buffering response %o', lodash_1.default.pick(incomingRes, 'headers', 'statusCode'));
                    if (newUrl == null) {
                        newUrl = urlStr;
                    }
                    return runPhase(() => {
                        // get the cookies that would be sent with this request so they can be rehydrated
                        return automationRequest('get:cookies', {
                            domain: network_1.cors.getSuperDomain(newUrl),
                        })
                            .then((cookies) => {
                            const statusIs2xxOrAllowedFailure = () => {
                                // is our status code in the 2xx range, or have we disabled failing
                                // on status code?
                                return status_code_1.default.isOk(incomingRes.statusCode) || options.failOnStatusCode === false;
                            };
                            const isOk = statusIs2xxOrAllowedFailure();
                            const contentType = headers_1.default.getContentType(incomingRes);
                            const details = {
                                isOkStatusCode: isOk,
                                contentType,
                                url: newUrl,
                                status: incomingRes.statusCode,
                                cookies,
                                statusText: status_code_1.default.getText(incomingRes.statusCode),
                                redirects,
                                originalUrl,
                            };
                            // does this response have this cypress header?
                            const fp = incomingRes.headers['x-cypress-file-path'];
                            if (fp) {
                                // if so we know this is a local file request
                                details.filePath = fp;
                            }
                            debug('setting details resolving url %o', details);
                            const concatStr = (0, network_1.concatStream)((responseBuffer) => {
                                // buffer the entire response before resolving.
                                // this allows us to detect & reject ETIMEDOUT errors
                                // where the headers have been sent but the
                                // connection hangs before receiving a body.
                                var _a;
                                // if there is not a content-type, try to determine
                                // if the response content is HTML-like
                                // https://github.com/cypress-io/cypress/issues/1727
                                details.isHtml = isResponseHtml(contentType, responseBuffer);
                                debug('resolve:url response ended, setting buffer %o', { newUrl, details });
                                details.totalTime = Date.now() - startTime;
                                // buffer the response and set the remote state if this is a successful html response
                                // TODO: think about moving this logic back into the frontend so that the driver can be in control
                                // of when to buffer and set the remote state
                                if (isOk && details.isHtml) {
                                    const urlDoesNotMatchPolicyBasedOnDomain = options.hasAlreadyVisitedUrl
                                        && !network_1.cors.urlMatchesPolicyBasedOnDomain(primaryRemoteState.origin, newUrl || '', { skipDomainInjectionForDomains: this.skipDomainInjectionForDomains })
                                        || options.isFromSpecBridge;
                                    if (!handlingLocalFile) {
                                        this._remoteStates.set(newUrl, options, !urlDoesNotMatchPolicyBasedOnDomain);
                                    }
                                    const responseBufferStream = new stream_1.default.PassThrough({
                                        highWaterMark: Number.MAX_SAFE_INTEGER,
                                    });
                                    responseBufferStream.end(responseBuffer);
                                    (_a = this._networkProxy) === null || _a === void 0 ? void 0 : _a.setHttpBuffer({
                                        url: newUrl,
                                        stream: responseBufferStream,
                                        details,
                                        originalUrl,
                                        response: incomingRes,
                                        urlDoesNotMatchPolicyBasedOnDomain,
                                    });
                                }
                                else {
                                    // TODO: move this logic to the driver too for
                                    // the same reasons listed above
                                    restorePreviousRemoteState(previousRemoteState, previousRemoteStateIsPrimary);
                                }
                                details.isPrimarySuperDomainOrigin = this._remoteStates.isPrimarySuperDomainOrigin(newUrl);
                                return resolve(details);
                            });
                            return str.pipe(concatStr);
                        }).catch(onReqError);
                    });
                });
            };
            const restorePreviousRemoteState = (previousRemoteState, previousRemoteStateIsPrimary) => {
                this._remoteStates.set(previousRemoteState, {}, previousRemoteStateIsPrimary);
            };
            // if they're POSTing an object, querystringify their POST body
            if ((options.method === 'POST') && lodash_1.default.isObject(options.body)) {
                options.form = options.body;
                delete options.body;
            }
            lodash_1.default.assign(options, {
                // turn off gzip since we need to eventually
                // rewrite these contents
                gzip: false,
                url: urlFile != null ? urlFile : urlStr,
                headers: lodash_1.default.assign({
                    accept: 'text/html,*/*',
                }, options.headers),
                onBeforeReqInit: runPhase,
                followRedirect(incomingRes) {
                    const status = incomingRes.statusCode;
                    const next = incomingRes.headers.location;
                    const curr = newUrl != null ? newUrl : urlStr;
                    newUrl = url_1.default.resolve(curr, next);
                    redirects.push([status, newUrl].join(': '));
                    return true;
                },
            });
            if (matchesNetStubbingRoute(options)) {
                // TODO: this is being used to force cy.visits to be interceptable by network stubbing
                // however, network errors will be obsfucated by the proxying so this is not an ideal solution
                lodash_1.default.merge(options, {
                    proxy: `http://127.0.0.1:${this._port()}`,
                    agent: null,
                    headers: {
                        'x-cypress-resolving-url': '1',
                    },
                });
            }
            debug('sending request with options %o', options);
            return runPhase(() => {
                // @ts-ignore
                return request.sendStream(headers, automationRequest, options)
                    .then((createReqStream) => {
                    const stream = createReqStream();
                    return onReqStreamReady(stream);
                }).catch(onReqError);
            });
        }));
    }
    onTestFileChange(filePath) {
        return this.socket.onTestFileChange(filePath);
    }
    _retryBaseUrlCheck(baseUrl, onWarning) {
        return ensureUrl.retryIsListening(baseUrl, {
            retryIntervals: [3000, 3000, 4000],
            onRetry({ attempt, delay, remaining }) {
                const warning = errors.get('CANNOT_CONNECT_BASE_URL_RETRYING', {
                    remaining,
                    attempt,
                    delay,
                    baseUrl,
                });
                return onWarning(warning);
            },
        });
    }
}
exports.ServerE2E = ServerE2E;

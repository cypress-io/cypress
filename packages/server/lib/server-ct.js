"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerCt = void 0;
const tslib_1 = require("tslib");
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const https_proxy_1 = tslib_1.__importDefault(require("@packages/https-proxy"));
const server_base_1 = require("@packages/server/lib/server-base");
const app_data_1 = tslib_1.__importDefault(require("@packages/server/lib/util/app_data"));
const makeGraphQLServer_1 = require("@packages/graphql/src/makeGraphQLServer");
class ServerCt extends server_base_1.ServerBase {
    open(config, options) {
        return super.open(config, { ...options, testingType: 'component' });
    }
    createServer(app, config, onWarning) {
        return new bluebird_1.default((resolve, reject) => {
            const { port, baseUrl, socketIoRoute } = config;
            this._server = this._createHttpServer(app);
            this.server.on('connect', this.onConnect.bind(this));
            this.server.on('upgrade', (req, socket, head) => this.onUpgrade(req, socket, head, socketIoRoute));
            this._graphqlWS = (0, makeGraphQLServer_1.graphqlWS)(this.server, `${socketIoRoute}-graphql`);
            return this._listen(port, (err) => {
                if (err.code === 'EADDRINUSE') {
                    reject(`Port ${port} is already in use`);
                }
                reject(err);
            })
                .then((port) => {
                https_proxy_1.default.create(app_data_1.default.path('proxy'), port, {
                    onRequest: this.callListeners.bind(this),
                    onUpgrade: this.onSniUpgrade.bind(this),
                })
                    .then((httpsProxy) => {
                    this._httpsProxy = httpsProxy;
                    // once we open set the domain to root by default
                    // which prevents a situation where navigating
                    // to http sites redirects to /__/ cypress
                    this._remoteStates.set(baseUrl);
                    return resolve([port]);
                });
            });
        });
    }
    destroyAut() {
        return this.socket.destroyAut();
    }
}
exports.ServerCt = ServerCt;

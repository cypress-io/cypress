"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectBase = void 0;
const tslib_1 = require("tslib");
const check_more_types_1 = tslib_1.__importDefault(require("check-more-types"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const events_1 = tslib_1.__importDefault(require("events"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const path_1 = tslib_1.__importDefault(require("path"));
const root_1 = tslib_1.__importDefault(require("@packages/root"));
const automation_1 = require("./automation");
const browsers_1 = tslib_1.__importDefault(require("./browsers"));
const config = tslib_1.__importStar(require("./config"));
const errors = tslib_1.__importStar(require("./errors"));
const preprocessor_1 = tslib_1.__importDefault(require("./plugins/preprocessor"));
const run_events_1 = tslib_1.__importDefault(require("./plugins/run_events"));
const reporter_1 = tslib_1.__importDefault(require("./reporter"));
const savedState = tslib_1.__importStar(require("./saved_state"));
const server_ct_1 = require("./server-ct");
const server_e2e_1 = require("./server-e2e");
const socket_ct_1 = require("./socket-ct");
const socket_e2e_1 = require("./socket-e2e");
const class_helpers_1 = require("./util/class-helpers");
const system_1 = tslib_1.__importDefault(require("./util/system"));
const data_context_1 = require("@packages/data-context");
const crypto_1 = require("crypto");
const localCwd = process.cwd();
const debug = (0, debug_1.default)('cypress:server:project');
class ProjectBase extends events_1.default {
    constructor({ projectRoot, testingType, options = {}, }) {
        super();
        this._recordTests = null;
        this._isServerOpen = false;
        this.isOpen = false;
        this.ensureProp = class_helpers_1.ensureProp;
        this.shouldCorrelatePreRequests = () => {
            return !!this.browser;
        };
        if (!projectRoot) {
            throw new Error('Instantiating lib/project requires a projectRoot!');
        }
        if (!check_more_types_1.default.unemptyString(projectRoot)) {
            throw new Error(`Expected project root path, not ${projectRoot}`);
        }
        this.testingType = testingType;
        this.projectRoot = path_1.default.resolve(projectRoot);
        this.spec = null;
        this.browser = null;
        this.id = (0, crypto_1.createHmac)('sha256', 'secret-key').update(projectRoot).digest('hex');
        this.ctx = (0, data_context_1.getCtx)();
        debug('Project created %o', {
            testingType: this.testingType,
            projectRoot: this.projectRoot,
        });
        this.options = {
            report: false,
            onFocusTests() { },
            onError(error) {
                errors.log(error);
            },
            onWarning: this.ctx.onWarning,
            ...options,
        };
    }
    setOnTestsReceived(fn) {
        this._recordTests = fn;
    }
    get server() {
        return this.ensureProp(this._server, 'open');
    }
    get automation() {
        return this.ensureProp(this._automation, 'open');
    }
    get cfg() {
        return this._cfg;
    }
    get state() {
        return this.cfg.state;
    }
    get remoteStates() {
        var _a;
        return (_a = this._server) === null || _a === void 0 ? void 0 : _a.remoteStates;
    }
    createServer(testingType) {
        return testingType === 'e2e'
            ? new server_e2e_1.ServerE2E()
            : new server_ct_1.ServerCt();
    }
    async open() {
        var _a, _b;
        debug('opening project instance %s', this.projectRoot);
        debug('project open options %o', this.options);
        const cfg = this.getConfig();
        process.chdir(this.projectRoot);
        this._server = this.createServer(this.testingType);
        const [port, warning] = await this._server.open(cfg, {
            getCurrentBrowser: () => this.browser,
            getSpec: () => this.spec,
            exit: (_a = this.options.args) === null || _a === void 0 ? void 0 : _a.exit,
            onError: this.options.onError,
            onWarning: this.options.onWarning,
            shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
            testingType: this.testingType,
            SocketCtor: this.testingType === 'e2e' ? socket_e2e_1.SocketE2E : socket_ct_1.SocketCt,
        });
        this.ctx.setAppServerPort(port);
        this._isServerOpen = true;
        // if we didnt have a cfg.port
        // then get the port once we
        // open the server
        if (!cfg.port) {
            cfg.port = port;
            // and set all the urls again
            lodash_1.default.extend(cfg, config.setUrls(cfg));
        }
        cfg.proxyServer = cfg.proxyUrl;
        // store the cfg from
        // opening the server
        this._cfg = cfg;
        debug('project config: %o', lodash_1.default.omit(cfg, 'resolved'));
        if (warning) {
            this.options.onWarning(warning);
        }
        // save the last time they opened the project
        // along with the first time they opened it
        const now = Date.now();
        const stateToSave = {
            lastOpened: now,
            lastProjectId: (_b = cfg.projectId) !== null && _b !== void 0 ? _b : null,
        };
        if (!cfg.state || !cfg.state.firstOpened) {
            stateToSave.firstOpened = now;
        }
        this.startWebsockets({
            onReloadBrowser: this.options.onReloadBrowser,
            onFocusTests: this.options.onFocusTests,
            onSpecChanged: this.options.onSpecChanged,
        }, {
            socketIoCookie: cfg.socketIoCookie,
            namespace: cfg.namespace,
            screenshotsFolder: cfg.screenshotsFolder,
            report: cfg.report,
            reporter: cfg.reporter,
            reporterOptions: cfg.reporterOptions,
            projectRoot: this.projectRoot,
        });
        await this.saveState(stateToSave);
        if (cfg.isTextTerminal) {
            return;
        }
        if (!cfg.experimentalInteractiveRunEvents) {
            return;
        }
        const sys = await system_1.default.info();
        const beforeRunDetails = {
            config: cfg,
            cypressVersion: root_1.default.version,
            system: lodash_1.default.pick(sys, 'osName', 'osVersion'),
        };
        this.isOpen = true;
        return run_events_1.default.execute('before:run', beforeRunDetails);
    }
    reset() {
        debug('resetting project instance %s', this.projectRoot);
        this.spec = null;
        this.browser = null;
        if (this._automation) {
            this._automation.reset();
        }
        if (this._server) {
            return this._server.reset();
        }
        return;
    }
    __reset() {
        preprocessor_1.default.close();
        process.chdir(localCwd);
    }
    async close() {
        var _a;
        debug('closing project instance %s', this.projectRoot);
        this.spec = null;
        this.browser = null;
        if (!this._isServerOpen) {
            return;
        }
        this.__reset();
        this.ctx.setAppServerPort(undefined);
        this.ctx.setAppSocketServer(undefined);
        await Promise.all([
            (_a = this.server) === null || _a === void 0 ? void 0 : _a.close(),
        ]);
        this._isServerOpen = false;
        this.isOpen = false;
        const config = this.getConfig();
        if (config.isTextTerminal || !config.experimentalInteractiveRunEvents)
            return;
        return run_events_1.default.execute('after:run');
    }
    initializeReporter({ report, reporter, projectRoot, reporterOptions, }) {
        if (!report) {
            return;
        }
        try {
            reporter_1.default.loadReporter(reporter, projectRoot);
        }
        catch (error) {
            const paths = reporter_1.default.getSearchPathsForReporter(reporter, projectRoot);
            errors.throwErr('INVALID_REPORTER_NAME', {
                paths,
                error,
                name: reporter,
            });
        }
        return reporter_1.default.create(reporter, reporterOptions, projectRoot);
    }
    startWebsockets(options, { socketIoCookie, namespace, screenshotsFolder, report, reporter, reporterOptions, projectRoot }) {
        // if we've passed down reporter
        // then record these via mocha reporter
        const reporterInstance = this.initializeReporter({
            report,
            reporter,
            reporterOptions,
            projectRoot,
        });
        const onBrowserPreRequest = (browserPreRequest) => {
            this.server.addBrowserPreRequest(browserPreRequest);
        };
        const onRequestEvent = (eventName, data) => {
            this.server.emitRequestEvent(eventName, data);
        };
        this._automation = new automation_1.Automation(namespace, socketIoCookie, screenshotsFolder, onBrowserPreRequest, onRequestEvent);
        const io = this.server.startWebsockets(this.automation, this.cfg, {
            onReloadBrowser: options.onReloadBrowser,
            onFocusTests: options.onFocusTests,
            onSpecChanged: options.onSpecChanged,
            onSavedStateChanged: (state) => this.saveState(state),
            onCaptureVideoFrames: (data) => {
                // TODO: move this to browser automation middleware
                this.emit('capture:video:frames', data);
            },
            onConnect: (id) => {
                debug('socket:connected');
                this.emit('socket:connected', id);
            },
            onTestsReceivedAndMaybeRecord: async (runnables, cb) => {
                var _a;
                debug('received runnables %o', runnables);
                if (reporterInstance) {
                    reporterInstance.setRunnables(runnables);
                }
                if (this._recordTests) {
                    await ((_a = this._recordTests) === null || _a === void 0 ? void 0 : _a.call(this, runnables, cb));
                    this._recordTests = null;
                    return;
                }
                cb();
            },
            onMocha: async (event, runnable) => {
                debug('onMocha', event);
                // bail if we dont have a
                // reporter instance
                if (!reporterInstance) {
                    return;
                }
                reporterInstance.emit(event, runnable);
                if (event === 'end') {
                    const [stats = {}] = await Promise.all([
                        (reporterInstance != null ? reporterInstance.end() : undefined),
                        this.server.end(),
                    ]);
                    this.emit('end', stats);
                }
                return;
            },
        });
        this.ctx.setAppSocketServer(io);
    }
    async resetBrowserTabsForNextTest(shouldKeepTabOpen) {
        return this.server.socket.resetBrowserTabsForNextTest(shouldKeepTabOpen);
    }
    async resetBrowserState() {
        return this.server.socket.resetBrowserState();
    }
    isRunnerSocketConnected() {
        return this.server.socket.isRunnerSocketConnected();
    }
    async sendFocusBrowserMessage() {
        if (this.browser.family === 'firefox') {
            await browsers_1.default.setFocus();
        }
        else {
            await this.server.sendFocusBrowserMessage();
        }
    }
    setCurrentSpecAndBrowser(spec, browser) {
        this.spec = spec;
        this.browser = browser;
    }
    getAutomation() {
        return this.automation;
    }
    async initializeConfig() {
        this.ctx.lifecycleManager.setAndLoadCurrentTestingType(this.testingType);
        let theCfg = {
            ...(await this.ctx.lifecycleManager.getFullInitialConfig()),
            testingType: this.testingType,
        }; // ?? types are definitely wrong here I think
        if (theCfg.isTextTerminal) {
            this._cfg = theCfg;
            return this._cfg;
        }
        const cfgWithSaved = await this._setSavedState(theCfg);
        this._cfg = cfgWithSaved;
        return this._cfg;
    }
    // returns project config (user settings + defaults + cypress.config.{js,ts,mjs,cjs})
    // with additional object "state" which are transient things like
    // window width and height, DevTools open or not, etc.
    getConfig() {
        var _a, _b, _c;
        if (!this._cfg) {
            throw Error('Must call #initializeConfig before accessing config.');
        }
        debug('project has config %o', this._cfg);
        return {
            ...this._cfg,
            remote: (_b = (_a = this.remoteStates) === null || _a === void 0 ? void 0 : _a.current()) !== null && _b !== void 0 ? _b : {},
            browser: this.browser,
            testingType: (_c = this.ctx.coreData.currentTestingType) !== null && _c !== void 0 ? _c : 'e2e',
            specs: [],
        };
    }
    // Saved state
    // forces saving of project's state by first merging with argument
    async saveState(stateChanges = {}) {
        if (!this.cfg) {
            throw new Error('Missing project config');
        }
        if (!this.projectRoot) {
            throw new Error('Missing project root');
        }
        let state = await savedState.create(this.projectRoot, this.cfg.isTextTerminal);
        state.set(stateChanges);
        this.cfg.state = await state.get();
        return this.cfg.state;
    }
    async _setSavedState(cfg) {
        debug('get saved state');
        const state = await savedState.create(this.projectRoot, cfg.isTextTerminal);
        cfg.state = await state.get();
        return cfg;
    }
    // These methods are not related to start server/sockets/runners
    async getProjectId() {
        return (0, data_context_1.getCtx)().lifecycleManager.getProjectId();
    }
    // For testing
    // Do not use this method outside of testing
    // pass all your options when you create a new instance!
    __setOptions(options) {
        this.options = options;
    }
    __setConfig(cfg) {
        this._cfg = cfg;
    }
}
exports.ProjectBase = ProjectBase;

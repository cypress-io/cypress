"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openProject = exports.OpenProject = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const lazy_ass_1 = tslib_1.__importDefault(require("lazy-ass"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const assert_1 = tslib_1.__importDefault(require("assert"));
const project_base_1 = require("./project-base");
const browsers_1 = tslib_1.__importDefault(require("./browsers"));
const errors = tslib_1.__importStar(require("./errors"));
const preprocessor_1 = tslib_1.__importDefault(require("./plugins/preprocessor"));
const run_events_1 = tslib_1.__importDefault(require("./plugins/run_events"));
const session = tslib_1.__importStar(require("./session"));
const cookies_1 = require("./util/cookies");
const project_utils_1 = require("./project_utils");
const data_context_1 = require("@packages/data-context");
const util_1 = require("@packages/data-context/src/util");
const debug = (0, debug_1.default)('cypress:server:open_project');
class OpenProject {
    constructor() {
        this.projectBase = null;
        this.relaunchBrowser = () => {
            throw new Error('bad relaunch');
        };
        return (0, util_1.autoBindDebug)(this);
    }
    resetOpenProject() {
        var _a;
        (_a = this.projectBase) === null || _a === void 0 ? void 0 : _a.__reset();
        this.projectBase = null;
        this.relaunchBrowser = () => {
            throw new Error('bad relaunch after reset');
        };
    }
    reset() {
        cookies_1.cookieJar.removeAllCookies();
        session.clearSessions(true);
        this.resetOpenProject();
    }
    getConfig() {
        var _a;
        return (_a = this.projectBase) === null || _a === void 0 ? void 0 : _a.getConfig();
    }
    getRemoteStates() {
        var _a;
        return (_a = this.projectBase) === null || _a === void 0 ? void 0 : _a.remoteStates;
    }
    getProject() {
        return this.projectBase;
    }
    async launch(browser, spec, prevOptions) {
        this._ctx = (0, data_context_1.getCtx)();
        (0, assert_1.default)(this.projectBase, 'Cannot launch runner if projectBase is undefined!');
        debug('resetting project state, preparing to launch browser %s for spec %o options %o', browser.name, spec, prevOptions);
        (0, lazy_ass_1.default)(lodash_1.default.isPlainObject(browser), 'expected browser object:', browser);
        // reset to reset server and socket state because
        // of potential domain changes, request buffers, etc
        this.projectBase.reset();
        const url = process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF ? undefined : (0, project_utils_1.getSpecUrl)({
            spec,
            browserUrl: this.projectBase.cfg.browserUrl,
            projectRoot: this.projectBase.projectRoot,
        });
        debug('open project url %s', url);
        const cfg = this.projectBase.getConfig();
        if (!cfg.proxyServer)
            throw new Error('Missing proxyServer in launch');
        const options = {
            browser,
            url,
            // TODO: fix majorVersion discrepancy that causes this to be necessary
            browsers: cfg.browsers,
            userAgent: cfg.userAgent,
            proxyUrl: cfg.proxyUrl,
            proxyServer: cfg.proxyServer,
            socketIoRoute: cfg.socketIoRoute,
            chromeWebSecurity: cfg.chromeWebSecurity,
            isTextTerminal: !!cfg.isTextTerminal,
            downloadsFolder: cfg.downloadsFolder,
            experimentalModifyObstructiveThirdPartyCode: cfg.experimentalModifyObstructiveThirdPartyCode,
            experimentalWebKitSupport: cfg.experimentalWebKitSupport,
            ...prevOptions || {},
        };
        // if we don't have the isHeaded property
        // then we're in interactive mode and we
        // can assume its a headed browser
        // TODO: we should clean this up
        if (!lodash_1.default.has(browser, 'isHeaded')) {
            browser.isHeaded = true;
            browser.isHeadless = false;
        }
        this.projectBase.setCurrentSpecAndBrowser(spec, browser);
        const automation = this.projectBase.getAutomation();
        // use automation middleware if its
        // been defined here
        const am = options.automationMiddleware;
        if (am) {
            automation.use(am);
        }
        if (!am || !am.onBeforeRequest) {
            automation.use({
                onBeforeRequest(message, data) {
                    if (message === 'take:screenshot') {
                        data.specName = spec.name;
                        return data;
                    }
                },
            });
        }
        const afterSpec = () => {
            if (!this.projectBase || cfg.isTextTerminal || !cfg.experimentalInteractiveRunEvents) {
                return bluebird_1.default.resolve();
            }
            return run_events_1.default.execute('after:spec', spec);
        };
        const { onBrowserClose } = options;
        options.onBrowserClose = () => {
            if (spec && spec.absolute) {
                preprocessor_1.default.removeFile(spec.absolute, cfg);
            }
            afterSpec()
                .catch((err) => {
                var _a, _b, _c;
                (_c = (_a = this.projectBase) === null || _a === void 0 ? void 0 : (_b = _a.options).onError) === null || _c === void 0 ? void 0 : _c.call(_b, err);
            });
            if (onBrowserClose) {
                return onBrowserClose();
            }
        };
        options.onError = this.projectBase.options.onError;
        this.relaunchBrowser = async () => {
            debug('launching browser: %o, spec: %s', browser, spec.relative);
            // clear cookies and all session data before each spec
            cookies_1.cookieJar.removeAllCookies();
            session.clearSessions();
            // TODO: Stub this so we can detect it being called
            if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
                return await browsers_1.default.connectToExisting(browser, options, automation);
            }
            if (options.shouldLaunchNewTab) {
                const onInitializeNewBrowserTab = async () => {
                    await this.resetBrowserState();
                };
                // If we do not launch the browser,
                // we tell it that we are ready
                // to receive the next spec
                return await browsers_1.default.connectToNewSpec(browser, { onInitializeNewBrowserTab, ...options }, automation);
            }
            options.relaunchBrowser = this.relaunchBrowser;
            return await browsers_1.default.open(browser, options, automation, this._ctx);
        };
        return this.relaunchBrowser();
    }
    closeBrowser() {
        return browsers_1.default.close();
    }
    async resetBrowserTabsForNextTest(shouldKeepTabOpen) {
        var _a;
        return (_a = this.projectBase) === null || _a === void 0 ? void 0 : _a.resetBrowserTabsForNextTest(shouldKeepTabOpen);
    }
    async resetBrowserState() {
        var _a;
        return (_a = this.projectBase) === null || _a === void 0 ? void 0 : _a.resetBrowserState();
    }
    closeOpenProjectAndBrowsers() {
        var _a;
        (_a = this.projectBase) === null || _a === void 0 ? void 0 : _a.close().catch((e) => {
            var _a;
            (_a = this._ctx) === null || _a === void 0 ? void 0 : _a.logTraceError(e);
        });
        this.resetOpenProject();
        return this.closeBrowser();
    }
    close() {
        debug('closing opened project');
        return this.closeOpenProjectAndBrowsers();
    }
    changeUrlToSpec(spec) {
        if (!this.projectBase) {
            return;
        }
        const newSpecUrl = (0, project_utils_1.getSpecUrl)({
            projectRoot: this.projectBase.projectRoot,
            spec,
        });
        debug(`New url is ${newSpecUrl}`);
        this.projectBase.server._socket.changeToUrl(newSpecUrl);
    }
    /**
     * Sends the new telemetry context to the browser
     * @param context - telemetry context string
     * @returns
     */
    updateTelemetryContext(context) {
        var _a;
        return (_a = this.projectBase) === null || _a === void 0 ? void 0 : _a.server._socket.updateTelemetryContext(context);
    }
    // close existing open project if it exists, for example
    // if you are switching from CT to E2E or vice versa.
    // used by launchpad
    async closeActiveProject() {
        await this.closeOpenProjectAndBrowsers();
    }
    async create(path, args, options) {
        var _a;
        // ensure switching to a new project in cy-in-cy tests and from the launchpad starts with a clean slate
        this.reset();
        this._ctx = (0, data_context_1.getCtx)();
        debug('open_project create %s', path);
        lodash_1.default.defaults(options, {
            onReloadBrowser: () => {
                if (this.relaunchBrowser) {
                    return this.relaunchBrowser();
                }
                return;
            },
        });
        if (!lodash_1.default.isUndefined(args.configFile) && !lodash_1.default.isNull(args.configFile)) {
            options.configFile = args.configFile;
        }
        options = lodash_1.default.extend({}, args.config, options, { args });
        // open the project and return
        // the config for the project instance
        debug('opening project %s', path);
        debug('and options %o', options);
        (0, assert_1.default)(args.testingType);
        const testingType = args.testingType === 'component' ? 'component' : 'e2e';
        this._ctx.lifecycleManager.runModeExitEarly = (_a = options.onError) !== null && _a !== void 0 ? _a : undefined;
        // store the currently open project
        this.projectBase = new project_base_1.ProjectBase({
            testingType,
            projectRoot: path,
            options: {
                ...options,
                testingType,
            },
        });
        // This was previously in the ProjectBase constructor but is now async
        await this._ctx.lifecycleManager.setCurrentProject(path);
        try {
            await this.projectBase.initializeConfig();
            await this.projectBase.open();
        }
        catch (err) {
            if (err.isCypressErr && err.portInUse) {
                errors.throwErr(err.type, err.port);
            }
            else {
                // rethrow and handle elsewhere
                throw (err);
            }
        }
        return this;
    }
    // for testing purposes
    __reset() {
        this.resetOpenProject();
    }
    async sendFocusBrowserMessage() {
        var _a, _b;
        const isRunnerConnected = (_a = this.projectBase) === null || _a === void 0 ? void 0 : _a.isRunnerSocketConnected();
        // If the runner's socket is active and connected, we focus the active window
        if (isRunnerConnected) {
            return (_b = this.projectBase) === null || _b === void 0 ? void 0 : _b.sendFocusBrowserMessage();
        }
        // Otherwise, we relaunch the app in the current browser
        if (this.relaunchBrowser) {
            return this.relaunchBrowser();
        }
    }
}
exports.OpenProject = OpenProject;
exports.openProject = new OpenProject();

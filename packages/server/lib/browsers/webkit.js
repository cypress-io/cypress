"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.open = exports.connectToExisting = exports.clearInstanceState = exports.connectToNewSpec = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const events_1 = require("events");
const webkit_automation_1 = require("./webkit-automation");
const unhandledExceptions = tslib_1.__importStar(require("../unhandled_exceptions"));
const utils_1 = tslib_1.__importDefault(require("./utils"));
const debug = (0, debug_1.default)('cypress:server:browsers:webkit');
let wkAutomation;
async function connectToNewSpec(browser, options, automation) {
    if (!wkAutomation)
        throw new Error('connectToNewSpec called without wkAutomation');
    automation.use(wkAutomation);
    wkAutomation.automation = automation;
    await options.onInitializeNewBrowserTab();
    await wkAutomation.reset({
        newUrl: options.url,
        downloadsFolder: options.downloadsFolder,
        videoApi: options.videoApi,
    });
}
exports.connectToNewSpec = connectToNewSpec;
/**
 * Clear instance state for the webkit instance, this is normally called in on kill or on exit.
 */
function clearInstanceState() {
    wkAutomation = undefined;
}
exports.clearInstanceState = clearInstanceState;
function connectToExisting() {
    throw new Error('Cypress-in-Cypress is not supported for WebKit.');
}
exports.connectToExisting = connectToExisting;
/**
 * Playwright adds an `exit` event listener to run a cleanup process. It tries to use the current binary to run a Node script by passing it as argv[1].
 * However, the Electron binary does not support an entrypoint, leading Cypress to think it's being opened in global mode (no args) when this fn is called.
 * Solution is to filter out the problematic function.
 * TODO(webkit): do we want to run this cleanup script another way?
 * @see https://github.com/microsoft/playwright/blob/7e2aec7454f596af452b51a2866e86370291ac8b/packages/playwright-core/src/utils/processLauncher.ts#L191-L203
 */
function removeBadExitListener() {
    const killProcessAndCleanup = process.rawListeners('exit').find((fn) => fn.name === 'killProcessAndCleanup');
    // @ts-expect-error Electron's Process types override those of @types/node, leading to `exit` not being recognized as an event
    if (killProcessAndCleanup)
        process.removeListener('exit', killProcessAndCleanup);
    else
        debug('did not find killProcessAndCleanup, which may cause interactive mode to unexpectedly open');
}
async function open(browser, url, options, automation) {
    var _a;
    if (!options.experimentalWebKitSupport) {
        throw new Error('WebKit was launched, but the experimental feature was not enabled. Please add `experimentalWebKitSupport: true` to your config file to launch WebKit.');
    }
    // resolve pw from user's project path
    const pwModulePath = require.resolve('playwright-webkit', { paths: [process.cwd()] });
    let pw;
    try {
        pw = await Promise.resolve().then(() => tslib_1.__importStar(require(pwModulePath)));
    }
    catch (err) {
        err.message = `There was an error importing \`playwright-webkit\`, is it installed?\n\nError text: ${err.stack}`;
        throw err;
    }
    const defaultLaunchOptions = {
        preferences: {
            proxy: {
                server: options.proxyServer,
            },
            headless: browser.isHeadless,
        },
        extensions: [],
        args: [],
        env: {},
    };
    const launchOptions = await utils_1.default.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options);
    if (launchOptions.extensions.length)
        (_a = options.onWarning) === null || _a === void 0 ? void 0 : _a.call(options, new Error('WebExtensions not supported in WebKit, but extensions were passed in before:browser:launch.'));
    launchOptions.preferences.args = [...launchOptions.args, ...(launchOptions.preferences.args || [])];
    let pwServer;
    try {
        pwServer = await pw.webkit.launchServer(launchOptions.preferences);
    }
    catch (err) {
        err.message = `There was an error launching \`playwright-webkit\`: \n\n\`\`\`${err.message}\n\`\`\``;
        throw err;
    }
    removeBadExitListener();
    const pwBrowser = await pw.webkit.connect(pwServer.wsEndpoint());
    wkAutomation = await webkit_automation_1.WebKitAutomation.create({
        automation,
        browser: pwBrowser,
        initialUrl: url,
        downloadsFolder: options.downloadsFolder,
        videoApi: options.videoApi,
    });
    automation.use(wkAutomation);
    class WkInstance extends events_1.EventEmitter {
        constructor() {
            super();
            this.pid = pwServer.process().pid;
            pwBrowser.on('disconnected', () => {
                debug('pwBrowser disconnected');
                this.emit('exit');
            });
            this.suppressUnhandledEconnreset();
        }
        async kill() {
            debug('closing pwBrowser');
            await pwBrowser.close();
            clearInstanceState();
        }
        /**
         * An unhandled `read ECONNRESET` in the depths of `playwright-webkit` is causing the process to crash when running kitchensink on Linux. Absent a
         * way to attach to the `error` event, this replaces the global `unhandledException` handler with one that will not exit the process on ECONNRESET.
         */
        suppressUnhandledEconnreset() {
            unhandledExceptions.handle((err) => {
                return err.code === 'ECONNRESET';
            });
            // restore normal exception handling behavior
            this.once('exit', () => unhandledExceptions.handle());
        }
    }
    return new WkInstance();
}
exports.open = open;

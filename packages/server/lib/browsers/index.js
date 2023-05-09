"use strict";
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const utils_1 = tslib_1.__importDefault(require("./utils"));
const errors = tslib_1.__importStar(require("../errors"));
const check_more_types_1 = tslib_1.__importDefault(require("check-more-types"));
const child_process_1 = require("child_process");
const util_1 = tslib_1.__importDefault(require("util"));
const os_1 = tslib_1.__importDefault(require("os"));
const types_1 = require("@packages/types");
const debug = (0, debug_1.default)('cypress:server:browsers');
const isBrowserFamily = check_more_types_1.default.oneOf(types_1.BROWSER_FAMILY);
let instance = null;
let launchAttempt = 0;
const kill = (options = {}) => {
    options = lodash_1.default.defaults({}, options, {
        instance,
        isProcessExit: false,
        unbind: true,
        nullOut: true,
    });
    const instanceToKill = options.instance;
    if (!instanceToKill) {
        debug('browsers.kill called with no active instance');
        return Promise.resolve();
    }
    if (options.nullOut) {
        instance = null;
    }
    return new Promise((resolve) => {
        instanceToKill.once('exit', () => {
            if (options.unbind) {
                instanceToKill.removeAllListeners();
            }
            debug('browser process killed');
            resolve();
        });
        debug('killing browser process');
        instanceToKill.isProcessExit = options.isProcessExit;
        instanceToKill.kill();
    });
};
async function setFocus() {
    const platform = os_1.default.platform();
    const execAsync = util_1.default.promisify(child_process_1.exec);
    try {
        if (!instance)
            throw new Error('No instance in setFocus!');
        switch (platform) {
            case 'darwin':
                await execAsync(`open -a "$(ps -p ${instance.pid} -o comm=)"`);
                return;
            case 'win32': {
                await execAsync(`(New-Object -ComObject WScript.Shell).AppActivate(((Get-WmiObject -Class win32_process -Filter "ParentProcessID = '${instance.pid}'") | Select -ExpandProperty ProcessId))`, { shell: 'powershell.exe' });
                return;
            }
            default:
                debug(`Unexpected os platform ${platform}. Set focus is only functional on Windows and MacOS`);
        }
    }
    catch (error) {
        debug(`Failure to set focus. ${error}`);
    }
}
async function getBrowserLauncher(browser, browsers) {
    debug('getBrowserLauncher %o', { browser });
    if (browser.name === 'electron')
        return await Promise.resolve().then(() => tslib_1.__importStar(require('./electron')));
    if (browser.family === 'chromium')
        return await Promise.resolve().then(() => tslib_1.__importStar(require('./chrome')));
    if (browser.family === 'firefox')
        return await Promise.resolve().then(() => tslib_1.__importStar(require('./firefox')));
    if (browser.family === 'webkit')
        return await Promise.resolve().then(() => tslib_1.__importStar(require('./webkit')));
    return utils_1.default.throwBrowserNotFound(browser.name, browsers);
}
process.once('exit', () => kill({ isProcessExit: true }));
module.exports = {
    ensureAndGetByNameOrPath: utils_1.default.ensureAndGetByNameOrPath,
    isBrowserFamily,
    removeOldProfiles: utils_1.default.removeOldProfiles,
    get: utils_1.default.getBrowsers,
    close: kill,
    formatBrowsersToOptions: utils_1.default.formatBrowsersToOptions,
    setFocus,
    _setInstance(_instance) {
        // for testing
        instance = _instance;
    },
    // note: does not guarantee that `browser` is still running
    getBrowserInstance() {
        return instance;
    },
    async connectToExisting(browser, options, automation) {
        const browserLauncher = await getBrowserLauncher(browser, options.browsers);
        await browserLauncher.connectToExisting(browser, options, automation);
        return this.getBrowserInstance();
    },
    async connectToNewSpec(browser, options, automation) {
        const browserLauncher = await getBrowserLauncher(browser, options.browsers);
        const newInstance = await browserLauncher.connectToNewSpec(browser, options, automation);
        // if a new instance was returned, update our instance to use the new one
        if (newInstance) {
            instance = newInstance;
            instance.browser = browser;
        }
        return this.getBrowserInstance();
    },
    async open(browser, options, automation, ctx) {
        // this global helps keep track of which launch attempt is the latest one
        launchAttempt++;
        // capture the launch attempt number for this attempt, so that if the global
        // one changes in the course of launching, we know another attempt has been
        // made that should supercede it. see the long comment below for more details
        const thisLaunchAttempt = launchAttempt;
        // kill any currently open browser instance before launching a new one
        await kill();
        lodash_1.default.defaults(options, {
            onBrowserOpen() { },
            onBrowserClose() { },
        });
        ctx.browser.setBrowserStatus('opening');
        const browserLauncher = await getBrowserLauncher(browser, options.browsers);
        if (!options.url)
            throw new Error('Missing url in browsers.open');
        debug('opening browser %o', browser);
        const _instance = await browserLauncher.open(browser, options.url, options, automation);
        debug('browser opened');
        // in most cases, we'll kill any running browser instance before launching
        // a new one when we call `await kill()` early in this function.
        // however, the code that calls this sets a timeout and, if that timeout
        // hits, it catches the timeout error and retries launching the browser by
        // calling this function again. that means any attempt to launch the browser
        // isn't necessarily canceled; we just ignore its success. it's possible an
        // original attempt to launch the browser eventually does succeed after
        // we've already called this function again on retry. if the 1st
        // (now timed-out) browser launch succeeds after this attempt to kill it,
        // the 1st instance gets created but then orphaned when we override the
        // `instance` singleton after the 2nd attempt succeeds. subsequent code
        // expects only 1 browser to be connected at a time, so this causes wonky
        // things to occur because we end up connected to and receiving messages
        // from 2 browser instances.
        //
        // to counteract this potential race condition, we use the `launchAttempt`
        // global to essentially track which browser launch attempt is the latest
        // one. the latest one should always be the correct one we want to connect
        // to, so if the `launchAttempt` global has changed in the course of launching
        // this browser, it means it has been orphaned and should be terminated.
        //
        // https://github.com/cypress-io/cypress/issues/24377
        if (thisLaunchAttempt !== launchAttempt) {
            await kill({ instance: _instance, nullOut: false });
            return null;
        }
        instance = _instance;
        instance.browser = browser;
        // TODO: normalizing opening and closing / exiting
        // so that there is a default for each browser but
        // enable the browser to configure the interface
        instance.once('exit', async (code, signal) => {
            var _a;
            ctx.browser.setBrowserStatus('closed');
            // TODO: make this a required property
            if (!options.onBrowserClose)
                throw new Error('onBrowserClose did not exist in interactive mode');
            const browserDisplayName = ((_a = instance === null || instance === void 0 ? void 0 : instance.browser) === null || _a === void 0 ? void 0 : _a.displayName) || 'unknown';
            options.onBrowserClose();
            browserLauncher.clearInstanceState();
            instance = null;
            // We are being very narrow on when to restart the browser here. The only case we can reliably test the 'SIGTRAP' signal.
            // We want to avoid adding signals in here that may intentionally be caused by a user.
            // For example exiting firefox through either force quitting or quitting via cypress will fire a 'SIGTERM' event which
            // would result in constantly relaunching the browser when the user actively wants to quit.
            // On windows the crash produces 2147483651 as an exit code. We should add to the list of crashes we handle as we see them.
            // In the future we may consider delegating to the browsers to determine if an exit is a crash since it might be different
            // depending on what browser has crashed.
            if (code === null && ['SIGTRAP', 'SIGABRT'].includes(signal) || code === 2147483651 && signal === null) {
                const err = errors.get('BROWSER_CRASHED', browserDisplayName, code, signal);
                if (!options.onError) {
                    errors.log(err);
                    throw new Error('Missing onError in attachListeners');
                }
                await options.onError(err);
                await options.relaunchBrowser();
            }
        });
        // TODO: instead of waiting an arbitrary
        // amount of time here we could instead
        // wait for the socket.io connect event
        // which would mean that our browser is
        // completely rendered and open. that would
        // mean moving this code out of here and
        // into the project itself
        // (just like headless code)
        // ----------------------------
        // give a little padding around
        // the browser opening
        await bluebird_1.default.delay(1000);
        if (instance === null) {
            return null;
        }
        // TODO: make this a required property
        if (!options.onBrowserOpen)
            throw new Error('onBrowserOpen did not exist in interactive mode');
        options.onBrowserOpen();
        ctx.browser.setBrowserStatus('open');
        return instance;
    },
};

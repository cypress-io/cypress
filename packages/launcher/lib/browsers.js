"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("./log");
const cp = __importStar(require("child_process"));
/** list of the browsers we can detect and use by default */
exports.browsers = [
    {
        name: 'chrome',
        family: 'chromium',
        channel: 'stable',
        displayName: 'Chrome',
        versionRegex: /Google Chrome (\S+)/m,
        binary: ['google-chrome', 'chrome', 'google-chrome-stable'],
    },
    {
        name: 'chromium',
        family: 'chromium',
        // technically Chromium is always in development
        channel: 'stable',
        displayName: 'Chromium',
        versionRegex: /Chromium (\S+)/m,
        binary: ['chromium-browser', 'chromium'],
    },
    {
        name: 'chrome',
        family: 'chromium',
        channel: 'canary',
        displayName: 'Canary',
        versionRegex: /Google Chrome Canary (\S+)/m,
        binary: 'google-chrome-canary',
    },
    {
        name: 'firefox',
        family: 'firefox',
        channel: 'stable',
        displayName: 'Firefox',
        // Mozilla Firefox 70.0.1
        versionRegex: /^Mozilla Firefox ([^\sab]+)$/m,
        binary: 'firefox',
    },
    {
        name: 'firefox',
        family: 'firefox',
        channel: 'dev',
        displayName: 'Firefox Developer Edition',
        // Mozilla Firefox 73.0b12
        versionRegex: /^Mozilla Firefox (\S+b\S*)$/m,
        // ubuntu PPAs install it as firefox
        binary: ['firefox-developer-edition', 'firefox'],
    },
    {
        name: 'firefox',
        family: 'firefox',
        channel: 'nightly',
        displayName: 'Firefox Nightly',
        // Mozilla Firefox 74.0a1
        versionRegex: /^Mozilla Firefox (\S+a\S*)$/m,
        // ubuntu PPAs install it as firefox-trunk
        binary: ['firefox-nightly', 'firefox-trunk'],
    },
    {
        name: 'edge',
        family: 'chromium',
        channel: 'stable',
        displayName: 'Edge',
        versionRegex: /Microsoft Edge (\S+)/m,
        binary: ['edge', 'microsoft-edge'],
    },
    {
        name: 'edge',
        family: 'chromium',
        channel: 'canary',
        displayName: 'Edge Canary',
        versionRegex: /Microsoft Edge Canary (\S+)/m,
        binary: 'edge-canary',
    },
    {
        name: 'edge',
        family: 'chromium',
        channel: 'beta',
        displayName: 'Edge Beta',
        versionRegex: /Microsoft Edge Beta (\S+)/m,
        binary: 'edge-beta',
    },
    {
        name: 'edge',
        family: 'chromium',
        channel: 'dev',
        displayName: 'Edge Dev',
        versionRegex: /Microsoft Edge Dev (\S+)/m,
        binary: ['edge-dev', 'microsoft-edge-dev'],
    },
];
/** starts a found browser and opens URL if given one */
function launch(browser, url, args = []) {
    log_1.log('launching browser %o', { browser, url });
    if (!browser.path) {
        throw new Error(`Browser ${browser.name} is missing path`);
    }
    if (url) {
        args = [url].concat(args);
    }
    log_1.log('spawning browser with args %o', { args });
    const proc = cp.spawn(browser.path, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    proc.stdout.on('data', (buf) => {
        log_1.log('%s stdout: %s', browser.name, String(buf).trim());
    });
    proc.stderr.on('data', (buf) => {
        log_1.log('%s stderr: %s', browser.name, String(buf).trim());
    });
    proc.on('exit', (code, signal) => {
        log_1.log('%s exited: %o', browser.name, { code, signal });
    });
    return proc;
}
exports.launch = launch;

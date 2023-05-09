"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const marionette_client_1 = tslib_1.__importDefault(require("marionette-client"));
const message_js_1 = require("marionette-client/lib/marionette/message.js");
const util_1 = tslib_1.__importDefault(require("util"));
const foxdriver_1 = tslib_1.__importDefault(require("@benmalka/foxdriver"));
const protocol = tslib_1.__importStar(require("./protocol"));
const cdp_automation_1 = require("./cdp_automation");
const browser_cri_client_1 = require("./browser-cri-client");
const errors = require('../errors');
const debug = (0, debug_1.default)('cypress:server:browsers:firefox-util');
let forceGcCc;
let timings = {
    gc: [],
    cc: [],
    collections: [],
};
let driver;
const sendMarionette = (data) => {
    return driver.send(new message_js_1.Command(data));
};
const getTabId = (tab) => {
    return lodash_1.default.get(tab, 'browsingContextID');
};
const getDelayMsForRetry = (i) => {
    let maxRetries = Number.parseInt(process.env.CYPRESS_CONNECT_RETRY_THRESHOLD ? process.env.CYPRESS_CONNECT_RETRY_THRESHOLD : '62');
    if (i < 10) {
        return 100;
    }
    if (i < 18) {
        return 500;
    }
    if (i <= maxRetries) {
        return 1000;
    }
    return;
};
const getPrimaryTab = bluebird_1.default.method((browser) => {
    const setPrimaryTab = () => {
        return browser.listTabs()
            .then((tabs) => {
            browser.tabs = tabs;
            return browser.primaryTab = lodash_1.default.first(tabs);
        });
    };
    // on first connection
    if (!browser.primaryTab) {
        return setPrimaryTab();
    }
    // `listTabs` will set some internal state, including marking attached tabs
    // as detached. so use the raw `request` here:
    return browser.request('listTabs')
        .then(({ tabs }) => {
        const firstTab = lodash_1.default.first(tabs);
        // primaryTab has changed, get all tabs and rediscover first tab
        if (getTabId(browser.primaryTab.data) !== getTabId(firstTab)) {
            return setPrimaryTab();
        }
        return browser.primaryTab;
    });
});
const attachToTabMemory = bluebird_1.default.method((tab) => {
    // TODO: figure out why tab.memory is sometimes undefined
    if (!tab.memory)
        return;
    if (tab.memory.isAttached) {
        return;
    }
    return tab.memory.getState()
        .then((state) => {
        if (state === 'attached') {
            return;
        }
        tab.memory.on('garbage-collection', ({ data }) => {
            data.num = timings.collections.length + 1;
            timings.collections.push(data);
            debug('received garbage-collection event %o', data);
        });
        return tab.memory.attach();
    });
});
async function connectMarionetteToNewTab() {
    // When firefox closes its last tab, it keeps a blank tab open. This will be the only handle
    // So we will connect to it and navigate it to about:blank to set it up for CDP connection
    const handles = await sendMarionette({
        name: 'WebDriver:GetWindowHandles',
    });
    await sendMarionette({
        name: 'WebDriver:SwitchToWindow',
        parameters: { handle: handles[0] },
    });
    await navigateToUrl('about:blank');
}
async function connectToNewSpec(options, automation, browserCriClient) {
    debug('firefox: reconnecting to blank tab');
    await connectMarionetteToNewTab();
    debug('firefox: reconnecting CDP');
    const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank');
    await cdp_automation_1.CdpAutomation.create(pageCriClient.send, pageCriClient.on, browserCriClient.resetBrowserTargets, automation);
    await options.onInitializeNewBrowserTab();
    debug(`firefox: navigating to ${options.url}`);
    await navigateToUrl(options.url);
}
async function setupRemote(remotePort, automation, onError) {
    const browserCriClient = await browser_cri_client_1.BrowserCriClient.create(['127.0.0.1', '::1'], remotePort, 'Firefox', onError);
    const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank');
    await cdp_automation_1.CdpAutomation.create(pageCriClient.send, pageCriClient.on, browserCriClient.resetBrowserTargets, automation);
    return browserCriClient;
}
async function navigateToUrl(url) {
    await sendMarionette({
        name: 'WebDriver:Navigate',
        parameters: { url },
    });
}
const logGcDetails = () => {
    const reducedTimings = {
        ...timings,
        collections: lodash_1.default.map(timings.collections, (event) => {
            return lodash_1.default
                .chain(event)
                .extend({
                duration: lodash_1.default.sumBy(event.collections, (collection) => {
                    return collection.endTimestamp - collection.startTimestamp;
                }),
                spread: lodash_1.default.chain(event.collections).thru((collection) => {
                    const first = lodash_1.default.first(collection);
                    const last = lodash_1.default.last(collection);
                    return last.endTimestamp - first.startTimestamp;
                }).value(),
            })
                .pick('num', 'nonincrementalReason', 'reason', 'gcCycleNumber', 'duration', 'spread')
                .value();
        }),
    };
    debug('forced GC timings %o', util_1.default.inspect(reducedTimings, {
        breakLength: Infinity,
        maxArrayLength: Infinity,
    }));
    debug('forced GC times %o', {
        gc: reducedTimings.gc.length,
        cc: reducedTimings.cc.length,
        collections: reducedTimings.collections.length,
    });
    debug('forced GC averages %o', {
        gc: lodash_1.default.chain(reducedTimings.gc).sum().divide(reducedTimings.gc.length).value(),
        cc: lodash_1.default.chain(reducedTimings.cc).sum().divide(reducedTimings.cc.length).value(),
        collections: lodash_1.default.chain(reducedTimings.collections).sumBy('duration').divide(reducedTimings.collections.length).value(),
        spread: lodash_1.default.chain(reducedTimings.collections).sumBy('spread').divide(reducedTimings.collections.length).value(),
    });
    debug('forced GC totals %o', {
        gc: lodash_1.default.sum(reducedTimings.gc),
        cc: lodash_1.default.sum(reducedTimings.cc),
        collections: lodash_1.default.sumBy(reducedTimings.collections, 'duration'),
        spread: lodash_1.default.sumBy(reducedTimings.collections, 'spread'),
    });
    // reset all the timings
    timings = {
        gc: [],
        cc: [],
        collections: [],
    };
};
exports.default = {
    log() {
        logGcDetails();
    },
    collectGarbage() {
        return forceGcCc();
    },
    setup({ automation, extensions, onError, url, marionettePort, foxdriverPort, remotePort, }) {
        return bluebird_1.default.all([
            this.setupFoxdriver(foxdriverPort),
            this.setupMarionette(extensions, url, marionettePort),
            remotePort && setupRemote(remotePort, automation, onError),
        ]).then(([, , browserCriClient]) => navigateToUrl(url).then(() => browserCriClient));
    },
    connectToNewSpec,
    navigateToUrl,
    setupRemote,
    async setupFoxdriver(port) {
        await protocol._connectAsync({
            host: '127.0.0.1',
            port,
            getDelayMsForRetry,
        });
        const foxdriver = await foxdriver_1.default.attach('127.0.0.1', port);
        const { browser } = foxdriver;
        browser.on('error', (err) => {
            debug('received error from foxdriver connection, ignoring %o', err);
        });
        forceGcCc = () => {
            let gcDuration;
            let ccDuration;
            const gc = (tab) => {
                return () => {
                    // TODO: figure out why tab.memory is sometimes undefined
                    if (!tab.memory)
                        return;
                    const start = Date.now();
                    return tab.memory.forceGarbageCollection()
                        .then(() => {
                        gcDuration = Date.now() - start;
                        timings.gc.push(gcDuration);
                    });
                };
            };
            const cc = (tab) => {
                return () => {
                    // TODO: figure out why tab.memory is sometimes undefined
                    if (!tab.memory)
                        return;
                    const start = Date.now();
                    return tab.memory.forceCycleCollection()
                        .then(() => {
                        ccDuration = Date.now() - start;
                        timings.cc.push(ccDuration);
                    });
                };
            };
            debug('forcing GC and CC...');
            return getPrimaryTab(browser)
                .then((tab) => {
                return attachToTabMemory(tab)
                    .then(gc(tab))
                    .then(cc(tab));
            })
                .then(() => {
                debug('forced GC and CC completed %o', { ccDuration, gcDuration });
            })
                .tapCatch((err) => {
                debug('firefox RDP error while forcing GC and CC %o', err);
            });
        };
    },
    async setupMarionette(extensions, url, port) {
        await protocol._connectAsync({
            host: '127.0.0.1',
            port,
            getDelayMsForRetry,
        });
        driver = new marionette_client_1.default.Drivers.Promises({
            port,
            tries: 1, // marionette-client has its own retry logic which we want to avoid
        });
        debug('firefox: navigating page with webdriver');
        const onError = (from, reject) => {
            if (!reject) {
                reject = (err) => {
                    throw err;
                };
            }
            return (err) => {
                debug('error in marionette %o', { from, err });
                reject(errors.get('FIREFOX_MARIONETTE_FAILURE', from, err));
            };
        };
        await driver.connect()
            .catch(onError('connection'));
        await new bluebird_1.default((resolve, reject) => {
            const _onError = (from) => {
                return onError(from, reject);
            };
            const { tcp } = driver;
            tcp.socket.on('error', _onError('Socket'));
            tcp.client.on('error', _onError('CommandStream'));
            sendMarionette({
                name: 'WebDriver:NewSession',
                parameters: { acceptInsecureCerts: true },
            }).then(() => {
                return bluebird_1.default.all(lodash_1.default.map(extensions, (path) => {
                    return sendMarionette({
                        name: 'Addon:Install',
                        parameters: { path, temporary: true },
                    });
                }));
            })
                .then(resolve)
                .catch(_onError('commands'));
        });
        // even though Marionette is not used past this point, we have to keep the session open
        // or else `acceptInsecureCerts` will cease to apply and SSL validation prompts will appear.
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebKitAutomation = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const cdp_automation_1 = require("./cdp_automation");
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
const mime_1 = tslib_1.__importDefault(require("mime"));
const util_1 = require("../automation/util");
const debug = (0, debug_1.default)('cypress:server:browsers:webkit-automation');
const extensionMap = {
    'no_restriction': 'None',
    'lax': 'Lax',
    'strict': 'Strict',
};
function convertSameSiteExtensionToCypress(str) {
    return str ? extensionMap[str] : undefined;
}
const normalizeGetCookieProps = ({ name, value, domain, path, secure, httpOnly, sameSite, expires }) => {
    const cyCookie = {
        name,
        value,
        domain,
        path,
        secure,
        httpOnly,
        hostOnly: false,
        // Use expirationDate instead of expires
        ...expires !== -1 ? { expirationDate: expires } : {},
    };
    if (sameSite === 'None') {
        cyCookie.sameSite = 'no_restriction';
    }
    else if (sameSite) {
        cyCookie.sameSite = sameSite.toLowerCase();
    }
    return cyCookie;
};
const normalizeSetCookieProps = (cookie) => {
    return {
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expires: cookie.expirationDate,
        sameSite: convertSameSiteExtensionToCypress(cookie.sameSite),
    };
};
let requestIdCounter = 1;
const requestIdMap = new WeakMap();
let downloadIdCounter = 1;
class WebKitAutomation {
    constructor(opts) {
        this.onRequest = async (message, data) => {
            var _a, _b;
            switch (message) {
                case 'is:automation:client:connected':
                    return true;
                case 'get:cookies':
                    return await this.getCookies(data);
                case 'get:cookie':
                    return await this.getCookie(data);
                case 'set:cookie':
                    return await this.context.addCookies([normalizeSetCookieProps(data)]);
                case 'add:cookies':
                case 'set:cookies':
                    return await this.context.addCookies(data.map(normalizeSetCookieProps));
                case 'clear:cookies':
                    return await this.clearCookies(data);
                case 'clear:cookie':
                    return await this.clearCookie(data);
                case 'take:screenshot':
                    return await this.takeScreenshot(data);
                case 'focus:browser:window':
                    return await ((_a = this.context.pages[0]) === null || _a === void 0 ? void 0 : _a.bringToFront());
                case 'reset:browser:state':
                    debug('stubbed reset:browser:state');
                    return;
                case 'reset:browser:tabs:for:next:test':
                    if (data.shouldKeepTabOpen)
                        return await this.reset({});
                    return await ((_b = this.context.browser()) === null || _b === void 0 ? void 0 : _b.close());
                default:
                    throw new Error(`No automation handler registered for: '${message}'`);
            }
        };
        this.automation = opts.automation;
        this.browser = opts.browser;
    }
    // static initializer to avoid "not definitively declared"
    static async create(opts) {
        const wkAutomation = new WebKitAutomation(opts);
        await wkAutomation.reset({ downloadsFolder: opts.downloadsFolder, newUrl: opts.initialUrl, videoApi: opts.videoApi });
        return wkAutomation;
    }
    async reset(options) {
        debug('resetting playwright page + context %o', options);
        // new context comes with new cache + storage
        const newContext = await this.browser.newContext({
            ignoreHTTPSErrors: true,
            recordVideo: options.videoApi && {
                dir: os_1.default.tmpdir(),
                size: { width: 1280, height: 720 },
            },
        });
        const contextStarted = new Date;
        const oldPwPage = this.page;
        this.page = await newContext.newPage();
        this.context = this.page.context();
        this.handleRequestEvents();
        if (options.downloadsFolder)
            this.handleDownloadEvents(options.downloadsFolder);
        if (options.videoApi)
            this.recordVideo(options.videoApi, contextStarted);
        let promises = [];
        promises.push(this.markAutIframeRequests());
        if (oldPwPage)
            promises.push(oldPwPage.context().close());
        if (options.newUrl)
            promises.push(this.page.goto(options.newUrl));
        if (promises.length)
            await Promise.all(promises);
    }
    recordVideo(videoApi, startedVideoCapture) {
        const _this = this;
        videoApi.useVideoController({
            async endVideoCapture() {
                const pwVideo = _this.page.video();
                if (!pwVideo)
                    throw new Error('pw.page missing video in endVideoCapture, cannot save video');
                debug('ending video capture, closing page...');
                await Promise.all([
                    // pwVideo.saveAs will not resolve until the page closes, presumably we do want to close it
                    _this.page.close(),
                    pwVideo.saveAs(videoApi.videoName),
                ]);
            },
            writeVideoFrame: () => {
                throw new Error('writeVideoFrame called, but WebKit does not support streaming frame data.');
            },
            async restart() {
                throw new Error('Cannot restart WebKit video - WebKit cannot record video on multiple specs in single-tab mode.');
            },
            postProcessFfmpegOptions: {
                // WebKit seems to record at the highest possible frame rate, so filter out duplicate frames before compressing
                // otherwise compressing with all these dupe frames can take a really long time
                // https://stackoverflow.com/q/37088517/3474615
                outputOptions: ['-vsync vfr'],
                videoFilters: 'mpdecimate',
            },
            startedVideoCapture,
        });
    }
    async markAutIframeRequests() {
        function isAutIframeRequest(request) {
            var _a;
            // is an iframe
            return (request.resourceType() === 'document')
                // is a top-level iframe (only 1 parent in chain)
                && request.frame().parentFrame() && !((_a = request.frame().parentFrame()) === null || _a === void 0 ? void 0 : _a.parentFrame())
                // is not the runner itself
                && !request.url().includes('__cypress');
        }
        await this.context.route('**', (route, request) => {
            if (!isAutIframeRequest(request))
                return route.continue();
            return route.continue({
                headers: {
                    ...request.headers(),
                    'X-Cypress-Is-AUT-Frame': 'true',
                },
            });
        });
    }
    handleDownloadEvents(downloadsFolder) {
        this.page.on('download', async (download) => {
            const id = downloadIdCounter++;
            const suggestedFilename = download.suggestedFilename();
            const filePath = path_1.default.join(downloadsFolder, suggestedFilename);
            this.automation.push('create:download', {
                id,
                url: download.url(),
                filePath,
                mime: mime_1.default.getType(suggestedFilename),
            });
            // NOTE: WebKit does have a `downloadsPath` option, but it is trashed after each run
            // Cypress trashes before runs - so we have to use `.saveAs` to move it
            await download.saveAs(filePath);
            this.automation.push('complete:download', { id });
        });
    }
    handleRequestEvents() {
        // emit preRequest to proxy
        this.page.on('request', (request) => {
            var _a, _b;
            // ignore socket.io events
            // TODO: use config.socketIoRoute here instead
            if (request.url().includes('/__socket') || request.url().includes('/__cypress'))
                return;
            // pw does not expose an ID on requests, so create one
            const requestId = String(requestIdCounter++);
            requestIdMap.set(request, requestId);
            const browserPreRequest = {
                requestId,
                method: request.method(),
                url: request.url(),
                // TODO: await request.allHeaders() causes this to not resolve in time
                headers: request.headers(),
                resourceType: (0, cdp_automation_1.normalizeResourceType)(request.resourceType()),
                originalResourceType: request.resourceType(),
            };
            debug('received request %o', { browserPreRequest });
            (_b = (_a = this.automation).onBrowserPreRequest) === null || _b === void 0 ? void 0 : _b.call(_a, browserPreRequest);
        });
        this.page.on('requestfinished', async (request) => {
            var _a, _b;
            const requestId = requestIdMap.get(request);
            if (!requestId)
                return;
            const response = await request.response();
            const responseReceived = {
                requestId,
                status: response === null || response === void 0 ? void 0 : response.status(),
                headers: await (response === null || response === void 0 ? void 0 : response.allHeaders()),
            };
            debug('received requestfinished %o', { responseReceived });
            (_b = (_a = this.automation).onRequestEvent) === null || _b === void 0 ? void 0 : _b.call(_a, 'response:received', responseReceived);
        });
    }
    async getCookies(filter) {
        const cookies = await this.context.cookies();
        return cookies
            .filter((cookie) => {
            return (0, util_1.cookieMatches)(cookie, filter);
        })
            .map(normalizeGetCookieProps);
    }
    async getCookie(filter) {
        const cookies = await this.context.cookies();
        if (!cookies.length)
            return null;
        const cookie = cookies.find((cookie) => {
            return (0, util_1.cookieMatches)(cookie, filter);
        });
        if (!cookie)
            return null;
        return normalizeGetCookieProps(cookie);
    }
    /**
     * Clears one specific cookie
     * @param filter the cookie to be cleared
     * @returns the cleared cookie
     */
    async clearCookie(filter) {
        // webkit doesn't have a way to only clear certain cookies, so we have
        // to clear all cookies and put back the ones we don't want cleared
        const allCookies = await this.context.cookies();
        // persist everything but the first cookie that matches
        const persistCookies = allCookies.reduce((memo, cookie) => {
            if (memo.matched || !(0, util_1.cookieMatches)(cookie, filter)) {
                memo.cookies.push(cookie);
                return memo;
            }
            memo.matched = true;
            return memo;
        }, { matched: false, cookies: [] }).cookies;
        await this.context.clearCookies();
        if (persistCookies.length)
            await this.context.addCookies(persistCookies);
        return filter;
    }
    /**
     * Clear all cookies
     * @returns cookies cleared
     */
    async clearCookies(cookiesToClear) {
        // webkit doesn't have a way to only clear certain cookies, so we have
        // to clear all cookies and put back the ones we don't want cleared
        const allCookies = await this.context.cookies();
        const persistCookies = allCookies.filter((cookie) => {
            return !cookiesToClear.find((cookieToClear) => {
                return (0, util_1.cookieMatches)(cookie, cookieToClear);
            });
        });
        debug('clear cookies: %o', cookiesToClear);
        debug('put back cookies: %o', persistCookies);
        await this.context.clearCookies();
        if (persistCookies.length)
            await this.context.addCookies(persistCookies);
        return cookiesToClear;
    }
    async takeScreenshot(data) {
        const buffer = await this.page.screenshot({
            fullPage: data.capture === 'fullPage',
            timeout: 0,
            type: 'png',
        });
        const b64data = buffer.toString('base64');
        return `data:image/png;base64,${b64data}`;
    }
}
exports.WebKitAutomation = WebKitAutomation;

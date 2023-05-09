"use strict";
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const os_1 = tslib_1.__importDefault(require("os"));
const electron_1 = require("electron");
const cyIcons = tslib_1.__importStar(require("@packages/icons"));
const savedState = tslib_1.__importStar(require("../saved_state"));
const menu_1 = tslib_1.__importDefault(require("../gui/menu"));
const Windows = tslib_1.__importStar(require("../gui/windows"));
const makeGraphQLServer_1 = require("@packages/graphql/src/makeGraphQLServer");
const data_context_1 = require("@packages/data-context");
const telemetry_1 = require("@packages/telemetry");
const debug_1 = tslib_1.__importDefault(require("debug"));
const resolve_dist_1 = require("@packages/resolve-dist");
const debug = (0, debug_1.default)('cypress:server:interactive');
const isDev = () => {
    return Boolean(process.env['CYPRESS_INTERNAL_ENV'] === 'development');
};
module.exports = {
    isMac() {
        return os_1.default.platform() === 'darwin';
    },
    getWindowArgs(url, state) {
        // Electron Window's arguments
        // These options are passed to Electron's BrowserWindow
        const minWidth = Math.round(/* 13" MacBook Air */ 1792 / 3); // Thirds
        const preferredWidth = 1200;
        const minHeight = 400;
        const preferredHeight = 800;
        const chooseDimensions = ({ preferred, previous, minimum }) => {
            // If the user doesn't have a previous size that's valid or big
            // enough, use the preferred size instead.
            if (!previous || previous < minimum) {
                return preferred;
            }
            return previous;
        };
        const common = {
            url,
            // The backgroundColor should match the value we will show in the
            // launchpad frontend.
            // When we use a dist'd launchpad (production), this color won't be
            // as visible. However, in our local dev setup (launchpad running via
            // a dev server), the backgroundColor will flash if it is a
            // different color.
            backgroundColor: 'white',
            // Dimensions of the Electron window on initial launch.
            // Because we are migrating users that may have
            // a width smaller than the min dimensions, we will
            // force the dimensions to be within the minimum bounds.
            //
            // Doing this before launch (instead of relying on minW + minH)
            // prevents the window from jumping.
            width: chooseDimensions({
                preferred: preferredWidth,
                minimum: minWidth,
                previous: state.appWidth,
            }),
            height: chooseDimensions({
                preferred: preferredHeight,
                minimum: minHeight,
                previous: state.appHeight,
            }),
            minWidth,
            minHeight,
            x: state.appX,
            y: state.appY,
            type: 'INDEX',
            devTools: state.isAppDevToolsOpen,
            trackState: {
                width: 'appWidth',
                height: 'appHeight',
                x: 'appX',
                y: 'appY',
                devTools: 'isAppDevToolsOpen',
            },
            onBlur() {
                if (this.webContents.isDevToolsOpened()) {
                    return;
                }
                return Windows.hideAllUnlessAnotherWindowIsFocused();
            },
            onFocus() {
                // hide internal dev tools if in production and previously focused
                // window was the electron browser
                menu_1.default.set({ withInternalDevTools: isDev() });
                return Windows.showAll();
            },
            onClose() {
                electron_1.app.quit();
            },
        };
        return lodash_1.default.extend(common, this.platformArgs());
    },
    platformArgs() {
        const args = {
            darwin: {
                show: true,
                frame: true,
                transparent: false,
            },
            linux: {
                show: true,
                frame: true,
                transparent: false,
                icon: electron_1.nativeImage.createFromPath(cyIcons.getPathToIcon('icon_64x64.png')),
            },
        };
        return args[os_1.default.platform()];
    },
    async ready(options, launchpadPort) {
        const { projectRoot } = options;
        const ctx = (0, data_context_1.getCtx)();
        menu_1.default.set({
            withInternalDevTools: isDev(),
            onLogOutClicked() {
                return data_context_1.globalPubSub.emit('menu:item:clicked', 'log:out');
            },
            getGraphQLPort: () => {
                return ctx === null || ctx === void 0 ? void 0 : ctx.gqlServerPort;
            },
        });
        const State = await savedState.create(projectRoot, false);
        const state = await State.get();
        const url = (0, resolve_dist_1.getPathToDesktopIndex)(launchpadPort);
        const win = await Windows.open(projectRoot, this.getWindowArgs(url, state));
        ctx === null || ctx === void 0 ? void 0 : ctx.actions.electron.setBrowserWindow(win);
        return win;
    },
    async run(options, _loading) {
        // Note: We do not await the `_loading` promise here since initializing
        // the data context can significantly delay initial render of the UI
        // https://github.com/cypress-io/cypress/issues/26388#issuecomment-1492616609
        var _a, _b;
        const [, { port, endpoint }] = await Promise.all([
            electron_1.app.whenReady(),
            (0, makeGraphQLServer_1.makeGraphQLServer)(),
        ]);
        (_a = process.send) === null || _a === void 0 ? void 0 : _a.call(process, { event: 'graphql:ready', payload: { endpoint } });
        // Before the electron app quits, we interrupt and ensure the current
        // DataContext is completely destroyed prior to quitting the process.
        // Parts of the DataContext teardown are asynchronous, particularly the
        // closing of open file watchers, and not awaiting these can cause
        // the electron process to throw.
        // https://github.com/cypress-io/cypress/issues/22026
        electron_1.app.once('will-quit', (event) => {
            // We must call synchronously call preventDefault on the will-quit event
            // to halt the current quit lifecycle
            event.preventDefault();
            debug('clearing DataContext prior to quit');
            // We use setImmediate to guarantee that app.quit will be called asynchronously;
            // synchronously calling app.quit in the will-quit handler prevent the subsequent
            // close from occurring
            setImmediate(async () => {
                var _a;
                try {
                    await (0, data_context_1.clearCtx)();
                }
                catch (e) {
                    // Silently handle clearCtx errors, we still need to quit the app
                    debug(`DataContext cleared with error: ${e === null || e === void 0 ? void 0 : e.message}`);
                }
                debug('DataContext cleared, quitting app');
                (_a = telemetry_1.telemetry.getSpan('cypress')) === null || _a === void 0 ? void 0 : _a.end();
                await telemetry_1.telemetry.shutdown();
                electron_1.app.quit();
            });
        });
        (_b = telemetry_1.telemetry.getSpan('startup:time')) === null || _b === void 0 ? void 0 : _b.end();
        return this.ready(options, port);
    },
};

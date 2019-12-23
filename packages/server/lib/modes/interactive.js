/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _          = require("lodash");
const os         = require("os");
const EE         = require("events");
const { app }        = require("electron");
const image      = require("electron").nativeImage;
const Promise    = require("bluebird");
const cyIcons    = require("@cypress/icons");
const user       = require("../user");
const errors     = require("../errors");
const savedState = require("../saved_state");
const logs       = require("../gui/logs");
const menu       = require("../gui/menu");
const Events     = require("../gui/events");
const Windows    = require("../gui/windows");

const isDev = () => process.env["CYPRESS_ENV"] === "development";

module.exports = {
  isMac() {
    return os.platform() === "darwin";
  },

  getWindowArgs(state, options = {}) {
    const common = {
      backgroundColor: "#dfe2e4",
      width: state.appWidth || 800,
      height: state.appHeight || 550,
      minWidth: 458,
      minHeight: 400,
      x: state.appX,
      y: state.appY,
      type: "INDEX",
      devTools: state.isAppDevToolsOpen,
      trackState: {
        width: "appWidth",
        height: "appHeight",
        x: "appX",
        y: "appY",
        devTools: "isAppDevToolsOpen"
      },
      onBlur() {
        if (this.webContents.isDevToolsOpened()) { return; }

        return Windows.hideAllUnlessAnotherWindowIsFocused();
      },
      onFocus() {
        //# hide dev tools if in production and previously focused
        //# window was the electron browser
        menu.set({withDevTools: isDev()});
        return Windows.showAll();
      },
      onClose() {
        return process.exit();
      }
    };

    return _.extend(common, this.platformArgs());
  },

  platformArgs() {
    return {
      darwin: {
        show:        true,
        frame:       true,
        transparent: false
      },

      linux: {
        show:        true,
        frame:       true,
        transparent: false,
        icon: image.createFromPath(cyIcons.getPathToIcon("icon_128x128.png"))
      }
    }[os.platform()];
  },

  ready(options = {}) {
    const bus = new EE;

    const { projectRoot } = options;

    //# TODO: potentially just pass an event emitter
    //# instance here instead of callback functions
    menu.set({
      withDevTools: isDev(),
      onLogOutClicked() {
        return bus.emit("menu:item:clicked", "log:out");
      }
    });

    return savedState(projectRoot, false)
    .then(state => state.get())
    .then(state => {
      return Windows.open(projectRoot, this.getWindowArgs(state, options))
      .then(win => {
        Events.start(_.extend({}, options, {
          onFocusTests() { return win.focus(); },
          os: os.platform()
        }), bus);

        return win;
      });
    });
  },

  run(options) {
    const waitForReady = () =>
      new Promise(function(resolve, reject) {
        return app.on("ready", resolve);
      })
    ;

    return Promise.any([
      waitForReady(),
      Promise.delay(500)
    ])
    .then(() => {
      return this.ready(options);
    });
  }
};

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../../spec_helper");

const _             = require("lodash");
const path          = require("path");
const Promise       = require("bluebird");
const EE            = require("events").EventEmitter;
const {
  BrowserWindow
} = require("electron");
const cyDesktop     = require("@packages/desktop-gui");
const user          = require(`${root}../lib/user`);
const Windows       = require(`${root}../lib/gui/windows`);
const savedState    = require(`${root}../lib/saved_state`);

const DEFAULT_USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/0.0.0 Chrome/59.0.3071.115 Electron/1.8.2 Safari/537.36";

describe("lib/gui/windows", function() {
  beforeEach(function() {
    Windows.reset();

    this.win = new EE();
    this.win.loadURL = sinon.stub();
    this.win.destroy = sinon.stub();
    this.win.getSize = sinon.stub().returns([1, 2]);
    this.win.getPosition = sinon.stub().returns([3, 4]);
    this.win.webContents = new EE();
    this.win.webContents.openDevTools = sinon.stub();
    this.win.webContents.userAgent = DEFAULT_USER_AGENT;
    this.win.isDestroyed = sinon.stub().returns(false);

    return sinon.stub(Windows, "_newBrowserWindow").returns(this.win);
  });

  afterEach(() => Windows.reset());

  context(".getByWebContents", function() {
    beforeEach(() => sinon.stub(BrowserWindow, "fromWebContents"));

    return it("calls BrowserWindow.fromWebContents", function() {
      BrowserWindow.fromWebContents.withArgs("foo").returns("bar");
      return expect(Windows.getByWebContents("foo")).to.eq("bar");
    });
  });

  context(".open", function() {
    beforeEach(function() {
      return sinon.stub(Windows, "create").returns(this.win);
    });

    return it("sets default options", function() {
      const options = {
        type: "INDEX"
      };

      return Windows.open("/path/to/project", options)
      .then(function(win) {
        expect(options).to.deep.eq({
          height: 500,
          width: 600,
          type: "INDEX",
          show: true,
          url: cyDesktop.getPathToIndex(),
          webPreferences: {
            preload: path.resolve("lib", "ipc", "ipc.js")
          }
        });

        return expect(win.loadURL).to.be.calledWith(cyDesktop.getPathToIndex());
      });
    });
  });

  context(".create", () => it("opens dev tools if saved state is open", function() {
    Windows.create("/foo/", {devTools: true});
    expect(this.win.webContents.openDevTools).to.be.called;

    Windows.create("/foo/", {});
    return expect(this.win.webContents.openDevTools).not.to.be.calledTwice;
  }));

    //# TODO: test everything else going on in this method!

  return context(".trackState", function() {
    beforeEach(function() {
      return savedState.create()
      .then(state => {
        this.state = state;
        sinon.stub(this.state, "set");

        this.projectRoot = undefined;
        return this.keys = {
          width: "theWidth",
          height: "someHeight",
          x: "anX",
          y: "aY",
          devTools: "whatsUpWithDevTools"
        };
    });});

    it("saves size and position when window resizes, debounced", function() {
      //# tried using useFakeTimers here, but it didn't work for some
      //# reason, so this is the next best thing
      sinon.stub(_, "debounce").returnsArg(0);

      Windows.trackState(this.projectRoot, false, this.win, this.keys);
      this.win.emit("resize");

      expect(_.debounce).to.be.called;

      return Promise
      .delay(100)
      .then(() => {
        return expect(this.state.set).to.be.calledWith({
          theWidth: 1,
          someHeight: 2,
          anX: 3,
          aY: 4
        });
      });
    });

    it("returns if window isDestroyed on resize", function() {
      this.win.isDestroyed.returns(true);

      Windows.trackState(this.projectRoot, false, this.win, this.keys);
      this.win.emit("resize");

      return Promise
      .delay(100)
      .then(() => {
        return expect(this.state.set).not.to.be.called;
      });
    });

    it("saves position when window moves, debounced", function() {
      //# tried using useFakeTimers here, but it didn't work for some
      //# reason, so this is the next best thing
      sinon.stub(_, "debounce").returnsArg(0);
      Windows.trackState(this.projectRoot, false, this.win, this.keys);
      this.win.emit("moved");

      return Promise
      .delay(100)
      .then(() => {
        return expect(this.state.set).to.be.calledWith({
          anX: 3,
          aY: 4
        });
      });
    });

    it("returns if window isDestroyed on moved", function() {
      this.win.isDestroyed.returns(true);

      Windows.trackState(this.projectRoot, false, this.win, this.keys);
      this.win.emit("moved");

      return Promise
      .delay(100)
      .then(() => {
        return expect(this.state.set).not.to.be.called;
      });
    });

    it("saves dev tools state when opened", function() {
      Windows.trackState(this.projectRoot, false, this.win, this.keys);
      this.win.webContents.emit("devtools-opened");

      return Promise
      .delay(100)
      .then(() => {
        return expect(this.state.set).to.be.calledWith({whatsUpWithDevTools: true});
      });
    });

    return it("saves dev tools state when closed", function() {
      Windows.trackState(this.projectRoot, false, this.win, this.keys);
      this.win.webContents.emit("devtools-closed");

      return Promise
      .delay(100)
      .then(() => {
        return expect(this.state.set).to.be.calledWith({whatsUpWithDevTools: false});
      });
    });
  });
});

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../../spec_helper");

const _          = require("lodash");
const os         = require("os");
const electron   = require("electron");
const user       = require(`${root}../lib/user`);
const logger     = require(`${root}../lib/logger`);
const Updater    = require(`${root}../lib/updater`);
const savedState = require(`${root}../lib/saved_state`);
const menu       = require(`${root}../lib/gui/menu`);
const Events     = require(`${root}../lib/gui/events`);
const Windows   = require(`${root}../lib/gui/windows`);
const interactiveMode = require(`${root}../lib/modes/interactive`);

describe("gui/interactive", function() {
  context(".isMac", function() {
    it("returns true if os.platform is darwin", function() {
      sinon.stub(os, "platform").returns("darwin");

      return expect(interactiveMode.isMac()).to.be.true;
    });

    return it("returns false if os.platform isnt darwin", function() {
      sinon.stub(os, "platform").returns("linux64");

      return expect(interactiveMode.isMac()).to.be.false;
    });
  });

  context(".getWindowArgs", function() {
    it("exits process when onClose is called", function() {
      sinon.stub(process, "exit");
      interactiveMode.getWindowArgs({}).onClose();
      return expect(process.exit).to.be.called;
    });

    it("tracks state properties", function() {
      const { trackState } = interactiveMode.getWindowArgs({});

      const args = _.pick(trackState, "width", "height", "x", "y", "devTools");

      return expect(args).to.deep.eq({
        width: "appWidth",
        height: "appHeight",
        x: "appX",
        y: "appY",
        devTools: "isAppDevToolsOpen"
      });
    });

    it("renders with saved width if it exists", () => expect(interactiveMode.getWindowArgs({appWidth: 1}).width).to.equal(1));

    it("renders with default width if no width saved", () => expect(interactiveMode.getWindowArgs({}).width).to.equal(800));

    it("renders with saved height if it exists", () => expect(interactiveMode.getWindowArgs({appHeight: 2}).height).to.equal(2));

    it("renders with default height if no height saved", () => expect(interactiveMode.getWindowArgs({}).height).to.equal(550));

    it("renders with saved x if it exists", () => expect(interactiveMode.getWindowArgs({appX: 3}).x).to.equal(3));

    it("renders with no x if no x saved", () => expect(interactiveMode.getWindowArgs({}).x).to.be.undefined);

    it("renders with saved y if it exists", () => expect(interactiveMode.getWindowArgs({appY: 4}).y).to.equal(4));

    it("renders with no y if no y saved", () => expect(interactiveMode.getWindowArgs({}).y).to.be.undefined);

    return describe("on window focus", function() {
      beforeEach(() => sinon.stub(menu, "set"));

      it("calls menu.set withDevTools: true when in dev env", function() {
        const env = process.env["CYPRESS_ENV"];
        process.env["CYPRESS_ENV"] = "development";
        interactiveMode.getWindowArgs({}).onFocus();
        expect(menu.set.lastCall.args[0].withDevTools).to.be.true;
        return process.env["CYPRESS_ENV"] = env;
      });

      return it("calls menu.set withDevTools: false when not in dev env", function() {
        const env = process.env["CYPRESS_ENV"];
        process.env["CYPRESS_ENV"] = "production";
        interactiveMode.getWindowArgs({}).onFocus();
        expect(menu.set.lastCall.args[0].withDevTools).to.be.false;
        return process.env["CYPRESS_ENV"] = env;
      });
    });
  });

  context(".ready", function() {
    beforeEach(function() {
      this.win = {};
      this.state = {};

      sinon.stub(menu, "set");
      sinon.stub(Events, "start");
      sinon.stub(Windows, "open").resolves(this.win);
      sinon.stub(Windows, "trackState");

      const state = savedState();
      return sinon.stub(state, "get").resolves(this.state);
    });

    it("calls Events.start with options, adding env, onFocusTests, and os", function() {
      sinon.stub(os, "platform").returns("someOs");
      const opts = {};

      return interactiveMode.ready(opts).then(function() {
        expect(Events.start).to.be.called;
        expect(Events.start.lastCall.args[0].onFocusTests).to.be.a("function");
        return expect(Events.start.lastCall.args[0].os).to.equal("someOs");
      });
    });

    it("calls menu.set", () =>
      interactiveMode.ready({}).then(() => expect(menu.set).to.be.calledOnce)
    );

    it("calls menu.set withDevTools: true when in dev env", function() {
      const env = process.env["CYPRESS_ENV"];
      process.env["CYPRESS_ENV"] = "development";
      return interactiveMode.ready({}).then(function() {
        expect(menu.set.lastCall.args[0].withDevTools).to.be.true;
        return process.env["CYPRESS_ENV"] = env;
      });
    });

    it("calls menu.set withDevTools: false when not in dev env", function() {
      const env = process.env["CYPRESS_ENV"];
      process.env["CYPRESS_ENV"] = "production";
      return interactiveMode.ready({}).then(function() {
        expect(menu.set.lastCall.args[0].withDevTools).to.be.false;
        return process.env["CYPRESS_ENV"] = env;
      });
    });

    return it("resolves with win", function() {
      return interactiveMode.ready({}).then(win => {
        return expect(win).to.eq(this.win);
      });
    });
  });

  return context(".run", function() {
    beforeEach(() => sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync());

    return it("calls ready with options", function() {
      sinon.stub(interactiveMode, "ready");

      const opts = {};
      return interactiveMode.run(opts).then(() => expect(interactiveMode.ready).to.be.calledWith(opts));
    });
  });
});

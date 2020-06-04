/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const cp   = require("child_process");
const open = require(`${root}lib/util/open`);

const platform = p => Object.defineProperty(process, "platform", {
  value: p
});

describe("lib/util/open", function() {
  beforeEach(function() {
    this.platform = process.platform;

    const cpStub = sinon.stub({
      once() {},
      unref() {}
    });

    cpStub.once.withArgs("close").yieldsAsync(0);

    return sinon.stub(cp, "spawn").returns(cpStub);
  });

  afterEach(function() {
    //# reset the platform
    return platform(this.platform);
  });

  it("spawns process with osx args", function() {
    platform("darwin");

    return open.opn("../foo", {args: "-R"})
    .then(() => expect(cp.spawn).to.be.calledWith("open", ["-W", "-R", "../foo"]));
  });

  return it("spawns process with linux args", function() {
    platform("linux");

    return open.opn("../foo", {args: "-R"})
    .then(() => expect(cp.spawn).to.be.calledWithMatch("xdg-open", ["../foo"]));
  });
});

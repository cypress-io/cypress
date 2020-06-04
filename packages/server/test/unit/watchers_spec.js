/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const _ = require("lodash");
const chokidar = require("chokidar");
const dependencyTree = require("dependency-tree");
const Watchers = require(`${root}lib/watchers`);

describe("lib/watchers", function() {
  beforeEach(function() {
    this.standardWatcher = sinon.stub({
      on() {},
      close() {}
    });

    sinon.stub(chokidar, "watch").returns(this.standardWatcher);
    return this.watchers = new Watchers();
  });

  it("returns instance of watcher class", function() {
    return expect(this.watchers).to.be.instanceof(Watchers);
  });

  context("#watch", function() {
    beforeEach(function() {
      return this.watchers.watch("/foo/bar");
    });

    it("watches with chokidar", () => expect(chokidar.watch).to.be.calledWith("/foo/bar"));

    return it("stores a reference to the watcher", function() {
      expect(_.keys(this.watchers.watchers)).to.have.length(1);
      return expect(this.watchers.watchers).to.have.property("/foo/bar");
    });
  });

  context("#watchTree", function() {
    beforeEach(function() {
      sinon.stub(dependencyTree, "toList").returns([
        "/foo/bar",
        "/dep/a",
        "/dep/b"
      ]);
      return this.watchers.watchTree("/foo/bar");
    });

    it("watches each file in dependency tree", function() {
      expect(chokidar.watch).to.be.calledWith("/foo/bar");
      expect(chokidar.watch).to.be.calledWith("/dep/a");
      return expect(chokidar.watch).to.be.calledWith("/dep/b");
    });

    it("stores a reference to the watcher", function() {
      expect(_.keys(this.watchers.watchers)).to.have.length(3);
      expect(this.watchers.watchers).to.have.property("/foo/bar");
      expect(this.watchers.watchers).to.have.property("/dep/a");
      return expect(this.watchers.watchers).to.have.property("/dep/b");
    });

    return it("ignores node_modules", function() {
      expect(dependencyTree.toList.lastCall.args[0].filter("/foo/bar")).to.be.true;
      return expect(dependencyTree.toList.lastCall.args[0].filter("/node_modules/foo")).to.be.false;
    });
  });

  return context("#close", () => it("removes each watched property", function() {
    const watched1 = {close: sinon.spy()};
    this.watchers._add("/one", watched1);

    const watched2 = {close: sinon.spy()};
    this.watchers._add("/two", watched2);

    expect(_.keys(this.watchers.watchers)).to.have.length(2);

    this.watchers.close();

    expect(watched1.close).to.be.calledOnce;
    expect(watched2.close).to.be.calledOnce;

    return expect(_.keys(this.watchers.watchers)).to.have.length(0);
  }));
});

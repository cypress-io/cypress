/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const capture = require(`${root}lib/capture`);

describe("lib/capture", function() {
  afterEach(() => capture.restore());

  context("process.stdout.write", function() {
    beforeEach(function() {
      this.write    = sinon.spy(process.stdout, "write");
      return this.captured = capture.stdout();
    });

    return it("slurps up stdout", function() {
      console.log("foo");
      console.log("bar");
      process.stdout.write("baz");

      expect(this.captured.data).to.deep.eq([
        "foo\n",
        "bar\n",
        "baz"
      ]);

      expect(this.captured.toString()).to.eq("foo\nbar\nbaz");

      //# should still call through to write
      expect(this.write).to.be.calledWith("foo\n");
      expect(this.write).to.be.calledWith("bar\n");
      return expect(this.write).to.be.calledWith("baz");
    });
  });

  return context("process.log", function() {
    beforeEach(function() {
      this.log = process.log;
      this.logStub = (process.log = sinon.stub());

      return this.captured = capture.stdout();
    });

    afterEach(function() {
      return process.log = this.log;
    });

    return it("slurps up logs", function() {
      process.log("foo\n");
      process.log("bar\n");

      expect(this.captured.data).to.deep.eq([
        "foo\n",
        "bar\n"
      ]);

      expect(this.captured.toString()).to.eq("foo\nbar\n");

      //# should still call through to write
      expect(this.logStub).to.be.calledWith("foo\n");
      return expect(this.logStub).to.be.calledWith("bar\n");
    });
  });
});

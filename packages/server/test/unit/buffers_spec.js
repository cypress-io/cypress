/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const buffers = require(`${root}lib/util/buffers`);

describe("lib/util/buffers", function() {
  beforeEach(() => buffers.reset());

  afterEach(() => buffers.reset());

  context("#get", function() {
    it("returns buffer by url", function() {
      const obj = {url: "foo"};

      buffers.set(obj);

      const buffer = buffers.get("foo");

      return expect(buffer).to.deep.eq(obj);
    });

    return it("falls back to setting the port when buffer could not be found", function() {
      const obj = {url: "https://www.google.com/"};

      buffers.set(obj);

      const buffer = buffers.get("https://www.google.com:443/");

      return expect(buffer).to.deep.eq(obj);
    });
  });

  context("#getByOriginalUrl", () =>
    it("returns buffer by originalUrl", function() {
      const obj = {originalUrl: "foo"};

      buffers.set(obj);

      const buffer = buffers.getByOriginalUrl("foo");

      return expect(buffer).to.deep.eq(obj);
    })
  );

  return context("#take", function() {
    it("removes the found buffer", function() {
      const obj = {url: "https://www.google.com/"};

      buffers.set(obj);

      expect(buffers.all()).to.have.length(1);

      const buffer = buffers.take("https://www.google.com:443/");

      expect(buffer).to.deep.eq(obj);

      return expect(buffers.all()).to.have.length(0);
    });

    return it("does not remove anything when not found", function() {
      const obj = {url: "https://www.google.com/"};

      buffers.set(obj);

      expect(buffers.all()).to.have.length(1);

      const buffer = buffers.take("asdf");

      expect(buffer).to.be.undefined;

      return expect(buffers.all()).to.have.length(1);
    });
  });
});

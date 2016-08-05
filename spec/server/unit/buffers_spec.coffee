require("../spec_helper")

buffers = require("#{root}lib/util/buffers")

describe "lib/util/buffers", ->
  beforeEach ->
    buffers.reset()

  afterEach ->
    buffers.reset()

  context "#get", ->
    it "returns buffer by url", ->
      obj = {url: "foo"}

      buffers.set(obj)

      buffer = buffers.get("foo")

      expect(buffer).to.deep.eq(obj)

    it "falls back to setting the port when buffer could not be found", ->
      obj = {url: "https://www.google.com/"}

      buffers.set(obj)

      buffer = buffers.get("https://www.google.com:443/")

      expect(buffer).to.deep.eq(obj)

  context "#getByOriginalUrl", ->
    it "returns buffer by originalUrl", ->
      obj = {originalUrl: "foo"}

      buffers.set(obj)

      buffer = buffers.getByOriginalUrl("foo")

      expect(buffer).to.deep.eq(obj)
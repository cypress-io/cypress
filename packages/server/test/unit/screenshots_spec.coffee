require("../spec_helper")

_           = require("lodash")
path        = require("path")
dataUriToBuffer = require("data-uri-to-buffer")
Buffer      = require("buffer").Buffer
Jimp        = require("jimp")
Fixtures    = require("../support/helpers/fixtures")
config      = require("#{root}lib/config")
screenshots = require("#{root}lib/screenshots")
fs          = require("#{root}lib/util/fs")
settings    = require("#{root}lib/util/settings")
screenshotAutomation = require("#{root}lib/automation/screenshot")

image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAALlJREFUeNpi1F3xYAIDA4MBA35wgQWqyB5dRoaVmeHJ779wPhOM0aQtyBAoyglmOwmwM6z1lWY44CMDFgcBFmRTGp3EGGJe/WIQ5mZm4GRlBGJmhlm3PqGaeODpNzCtKsbGIARUCALvvv6FWw9XeOvrH4bbQNOQwfabnzHdGK3AwyAjyAqX2HPzC0Pn7Y9wPtyNIMGlD74wmAqwMZz+8AvFxzATVZAFQIqwABWQiWtgAY5uCnKAAwQYAPr8OZysiz4PAAAAAElFTkSuQmCC"

describe "lib/screenshots", ->
  beforeEach ->
    Fixtures.scaffold()
    @todosPath = Fixtures.projectPath("todos")

    @appData = {
      appOnly: true
      clip: { x: 0, y: 0, width: 10, height: 10 }
    }

    @buffer = {}

    @jimpImage = {
      bitmap: {
        width: 20
        height: 20
      }
      crop: @sandbox.stub()
      getBuffer: @sandbox.stub().resolves(@buffer)
      getMIME: -> "image/png"
      hash: @sandbox.stub().returns("image hash")
    }

    Jimp.prototype.composite = @sandbox.stub()
    Jimp.prototype.getBuffer = @sandbox.stub().resolves(@buffer)

    config.get(@todosPath).then (@config) =>

  afterEach ->
    Fixtures.remove()

  context ".capture", ->
    beforeEach ->
      @getPixelColor = @sandbox.stub()
      @getPixelColor.withArgs(0, 0).returns("black")
      @getPixelColor.withArgs(1, 0).returns("white")
      @getPixelColor.withArgs(0, 1).returns("white")
      @getPixelColor.withArgs(20, 0).returns("white")
      @getPixelColor.withArgs(0, 20).returns("white")
      @getPixelColor.withArgs(20, 20).returns("black")
      @jimpImage.getPixelColor = @getPixelColor

      @sandbox.stub(Jimp, "read").resolves(@jimpImage)
      intToRGBA = @sandbox.stub(Jimp, "intToRGBA")
      intToRGBA.withArgs("black").returns({ r: 0, g: 0, b: 0 })
      intToRGBA.withArgs("white").returns({ r: 255, g: 255, b: 255 })

      @automate = @sandbox.stub().resolves(image)

    it "captures screenshot with automation", ->
      data = {}
      screenshots.capture(data, @automate).then =>
        expect(@automate).to.be.calledOnce
        expect(@automate).to.be.calledWith(data)

    it "retries until helper pixels are no longer present for app capture", ->
      @getPixelColor.withArgs(0, 0).onCall(1).returns("white")
      screenshots.capture(@appData, @automate).then =>
        expect(@automate).to.be.calledTwice

    it "retries until helper pixels are present for runner capture", ->
      @getPixelColor.withArgs(0, 0).returns("white")
      @getPixelColor.withArgs(0, 0).onCall(1).returns("black")
      screenshots.capture({}, @automate).then =>
        expect(@automate).to.be.calledTwice

    it "gives up after 10 tries", ->
      screenshots.capture(@appData, @automate).then =>
        expect(@automate.callCount).to.equal(10)

    it "resolves buffer", ->
      @getPixelColor.withArgs(0, 0).returns("white")
      screenshots.capture(@appData, @automate).then (buffer) =>
        expect(buffer).to.equal(@buffer)

    describe "fullPage: true", ->
      beforeEach ->
        screenshots.clearFullPageState()

        @appData.fullPage = true
        @appData.current = 1
        @appData.total = 3

        @getPixelColor.withArgs(0, 0).onCall(1).returns("white")

      it "retries until helper pixels are no longer present on first capture", ->
        screenshots.capture(@appData, @automate).then =>
          expect(@automate).to.be.calledTwice

      it "retries until images aren't the same on subsequent captures", ->
        @jimpImage2 = _.extend({}, @jimpImage, {
          foo: true
          hash: -> "image 2 hash"
        })
        Jimp.read.onCall(3).resolves(@jimpImage2)

        screenshots.capture(@appData, @automate)
        .then =>
          @appData.current = 2
          screenshots.capture(@appData, @automate)
        .then =>
          expect(@automate.callCount).to.equal(4)

      it "resolves no buffer on non-last captures", ->
        screenshots.capture(@appData, @automate).then (buffer) ->
          expect(buffer).to.be.null

      it "resolves buffer on last capture", ->
        screenshots.capture(@appData, @automate)
        .then =>
          @appData.current = 3
          screenshots.capture(@appData, @automate)
        .then (buffer) =>
          expect(buffer).to.equal(@buffer)

      it "composites images into one image", ->
        screenshots.capture(@appData, @automate)
        .then =>
          @appData.current = 2
          screenshots.capture(@appData, @automate)
        .then =>
          @appData.current = 3
          screenshots.capture(@appData, @automate)
        .then =>
          composite = Jimp.prototype.composite
          expect(composite).to.be.calledThrice
          expect(composite.getCall(0).args[0]).to.equal(@jimpImage)
          expect(composite.getCall(0).args[1]).to.equal(0)
          expect(composite.getCall(0).args[2]).to.equal(0)
          expect(composite.getCall(1).args[0]).to.equal(@jimpImage)
          expect(composite.getCall(1).args[2]).to.equal(20)
          expect(composite.getCall(2).args[0]).to.equal(@jimpImage)
          expect(composite.getCall(2).args[2]).to.equal(40)

      it "clears previous full page state once complete", ->
        @appData.total = 2
        screenshots.capture(@appData, @automate)
        .then =>
          @appData.current = 2
          screenshots.capture(@appData, @automate)
        .then =>
          @appData.current = 1
          screenshots.capture(@appData, @automate)
        .then =>
          @appData.current = 2
          screenshots.capture(@appData, @automate)
        .then ->
          expect(Jimp.prototype.composite.callCount).to.equal(4)

      it "skips full page process if only one capture needed", ->
        @appData.total = 1
        screenshots.capture(@appData, @automate)
        .then ->
          expect(Jimp.prototype.composite).not.to.be.called

  context ".crop", ->
    beforeEach ->
      @dimensions = (overrides) ->
        _.extend({ x: 0, y: 0, width: 10, height: 10 }, overrides)

    it "crops to dimension size if less than the image size", ->
      screenshots.crop(@jimpImage, @dimensions()).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 10)

    it "crops to dimension size if less than the image size", ->
      screenshots.crop(@jimpImage, @dimensions()).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 10)

    it "crops to one less than width if dimensions x is more than the image width", ->
      screenshots.crop(@jimpImage, @dimensions({ x: 30 })).then =>
        expect(@jimpImage.crop).to.be.calledWith(19, 0, 1, 10)

    it "crops to one less than height if dimensions y is more than the image height", ->
      screenshots.crop(@jimpImage, @dimensions({ y: 30 })).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 19, 10, 1)

    it "crops only width if dimensions height is more than the image height", ->
      screenshots.crop(@jimpImage, @dimensions({ height: 30 })).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 20)

    it "crops only height if dimensions width is more than the image width", ->
      screenshots.crop(@jimpImage, @dimensions({ width: 30 })).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 20, 10)

    it "sets the type on the buffer after cropping", ->
      screenshots.crop(@jimpImage, @dimensions()).then (buffer) =>
        expect(buffer.type).to.equal("image/png")

  context ".save", ->
    it "outputs file and returns size and path", ->
      screenshots.save({name: "foo/tweet"}, dataUriToBuffer(image), @config.screenshotsFolder)
      .then (obj) =>
        expectedPath = path.normalize(@config.screenshotsFolder + "/footweet.png")
        actualPath = path.normalize(obj.path)

        expect(obj.size).to.eq("279 B")
        expect(actualPath).to.eq(expectedPath)
        expect(obj.width).to.eq(10)
        expect(obj.height).to.eq(10)

        fs.statAsync(expectedPath)

  context ".copy", ->
    it "doesnt yell over ENOENT errors", ->
      screenshots.copy("/does/not/exist", "/foo/bar/baz")

    it "copies src to des with {overwrite: true}", ->
      @sandbox.stub(fs, "copyAsync").withArgs("foo", "bar", {overwrite: true}).resolves()

      screenshots.copy("foo", "bar")

describe "lib/automation/screenshots", ->
  beforeEach ->
    @buffer = {}
    @image = {}
    @sandbox.stub(screenshots, "capture").resolves(@buffer)
    @sandbox.stub(screenshots, "save")

    @screenshot = screenshotAutomation("cypress/screenshots")

  it "captures screenshot", ->
    data = {}
    automation = ->
    @screenshot.capture(data, automation).then ->
      expect(screenshots.capture).to.be.calledWith(data, automation)

  it "saves screenshot if there's a buffer", ->
    data = {}
    @screenshot.capture(data, @automate).then =>
      expect(screenshots.save).to.be.calledWith(data, @buffer, "cypress/screenshots")

  it "does not save screenshot if there's no buffer", ->
    screenshots.capture.resolves(null)
    @screenshot.capture({}, @automate).then =>
      expect(screenshots.save).not.to.be.called

require("../spec_helper")

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
      viewport: { width: 10, height: 10 }
    }

    @jimpImage = {
      bitmap: {
        width: 20
        height: 20
      }
      crop: @sandbox.stub().resolves()
      getBuffer: @sandbox.stub().resolves({})
      getMIME: -> "image/png"
    }

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

  context ".crop", ->
    it "crops to viewport size if less than the image size", ->
      screenshots.crop(@jimpImage, { width: 10, height: 10 }).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 10)

    it "crops only width if viewport height is more than the image size", ->
      screenshots.crop(@jimpImage, { width: 10, height: 30 }).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 20)

    it "crops only height if viewport width is more than the image size", ->
      screenshots.crop(@jimpImage, { width: 30, height: 10 }).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 20, 10)

    it "sets the type on the buffer after cropping", ->
      screenshots.crop(@jimpImage, { width: 10, height: 10 }).then (buffer) =>
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
    @sandbox.stub(screenshots, "capture").resolves([@buffer, @image])
    @sandbox.stub(screenshots, "crop").resolves(@buffer)
    @sandbox.stub(screenshots, "save")

    @screenshot = screenshotAutomation("cypress/screenshots")

  it "captures screenshot", ->
    data = {}
    automation = ->
    @screenshot.capture(data, automation).then ->
      expect(screenshots.capture).to.be.calledWith(data, automation)

  it "crops screenshot if appOnly", ->
    viewport = {}
    @screenshot.capture({ appOnly: true, viewport }).then =>
      expect(screenshots.crop).to.be.calledWith(@image, viewport)

  it "does not crop screenshot if not appOnly", ->
    @screenshot.capture({}).then ->
      expect(screenshots.crop).to.not.be.called

  it "saves screenshot", ->
    data = {}
    @screenshot.capture(data, @automate).then =>
      expect(screenshots.save).to.be.calledWith(data, @buffer, "cypress/screenshots")

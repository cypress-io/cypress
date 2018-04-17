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

    config.get(@todosPath)
    .then (@cfg) =>

  afterEach ->
    Fixtures.remove()

  context ".save", ->
    it "outputs file and returns size and path", ->
      screenshots.save({name: "foo/tweet"}, dataUriToBuffer(image), @cfg.screenshotsFolder)
      .then (obj) =>
        expectedPath = path.normalize(@cfg.screenshotsFolder + "/footweet.png")
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
    @getPixelColor = @sandbox.stub()
    @getPixelColor.withArgs(0, 0).returns("black")
    @getPixelColor.withArgs(1, 0).returns("white")
    @getPixelColor.withArgs(0, 1).returns("white")
    @getPixelColor.withArgs(20, 0).returns("white")
    @getPixelColor.withArgs(0, 20).returns("white")
    @getPixelColor.withArgs(20, 20).returns("black")

    @jimpImage = {
      getPixelColor: @getPixelColor
      bitmap: {
        width: 20
        height: 20
      }
      crop: @sandbox.stub().resolves()
      getBuffer: @sandbox.stub().resolves({})
      getMIME: -> "image/png"
    }
    @sandbox.stub(Jimp, "read").resolves(@jimpImage)
    intToRGBA = @sandbox.stub(Jimp, "intToRGBA")
    intToRGBA.withArgs("black").returns({ r: 0, g: 0, b: 0 })
    intToRGBA.withArgs("white").returns({ r: 255, g: 255, b: 255 })

    @sandbox.stub(screenshots, "save")
    @automate = @sandbox.stub().resolves(image)

    @appData = {
      appOnly: true
      viewport: { width: 10, height: 10 }
    }

    @screenshot = screenshotAutomation("cypress/screenshots")

  it "captures screenshot with automation", ->
    data = {}
    @screenshot.capture(data, @automate).then =>
      expect(@automate).to.be.calledOnce
      expect(@automate).to.be.calledWith(data)

  it "saves screenshot with screenshots#save", ->
    data = {}
    @screenshot.capture(data, @automate).then ->
      expect(screenshots.save).to.be.called
      expect(screenshots.save.lastCall.args[0]).to.equal(data)
      expect(screenshots.save.lastCall.args[1]).to.an.instanceOf(Buffer)
      expect(screenshots.save.lastCall.args[2]).to.equal("cypress/screenshots")

  it "retries until helper pixels are no longer present for app capture", ->
    @getPixelColor.withArgs(0, 0).onCall(1).returns("white")
    @screenshot.capture(@appData, @automate).then =>
      expect(@automate).to.be.calledTwice

  it "retries until helper pixels are present for runner capture", ->
    @getPixelColor.withArgs(0, 0).returns("white")
    @getPixelColor.withArgs(0, 0).onCall(1).returns("black")
    @screenshot.capture({}, @automate).then =>
      expect(@automate).to.be.calledTwice

  it "gives up after 10 tries", ->
    @screenshot.capture(@appData, @automate).then =>
      expect(@automate.callCount).to.equal(10)

  it "sets the type on the buffer after cropping", ->
    @screenshot.capture(@appData, @automate).then =>
      expect(screenshots.save.lastCall.args[1].type).to.equal("image/png")

  describe "cropping app captures", ->

    it "crops to viewport size if less than the image size", ->
      @getPixelColor.withArgs(0, 0).returns("white")
      @screenshot.capture(@appData, @automate).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 10)

    it "crops only width if viewport height is more than the image size", ->
      @getPixelColor.withArgs(0, 0).returns("white")
      @appData.viewport.height = 30
      @screenshot.capture(@appData, @automate).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 20)

    it "crops only height if viewport width is more than the image size", ->
      @getPixelColor.withArgs(0, 0).returns("white")
      @appData.viewport.width = 30
      @screenshot.capture(@appData, @automate).then =>
        expect(@jimpImage.crop).to.be.calledWith(0, 0, 20, 10)

require("../spec_helper")

_           = require("lodash")
path        = require("path")
Jimp        = require("jimp")
Buffer      = require("buffer").Buffer
dataUriToBuffer = require("data-uri-to-buffer")
sizeOf      = require("image-size")
Fixtures    = require("../support/helpers/fixtures")
config      = require("#{root}lib/config")
screenshots = require("#{root}lib/screenshots")
fs          = require("#{root}lib/util/fs")
settings    = require("#{root}lib/util/settings")
screenshotAutomation = require("#{root}lib/automation/screenshot")

image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAALlJREFUeNpi1F3xYAIDA4MBA35wgQWqyB5dRoaVmeHJ779wPhOM0aQtyBAoyglmOwmwM6z1lWY44CMDFgcBFmRTGp3EGGJe/WIQ5mZm4GRlBGJmhlm3PqGaeODpNzCtKsbGIARUCALvvv6FWw9XeOvrH4bbQNOQwfabnzHdGK3AwyAjyAqX2HPzC0Pn7Y9wPtyNIMGlD74wmAqwMZz+8AvFxzATVZAFQIqwABWQiWtgAY5uCnKAAwQYAPr8OZysiz4PAAAAAElFTkSuQmCC"
iso8601Regex = /^\d{4}\-\d{2}\-\d{2}T\d{2}\:\d{2}\:\d{2}\.?\d*Z?$/

describe "lib/screenshots", ->
  beforeEach ->
    Fixtures.scaffold()
    @todosPath = Fixtures.projectPath("todos")

    @appData = {
      capture: "app"
      clip: { x: 0, y: 0, width: 10, height: 10 }
      viewport: { width: 40, height: 40 }
    }

    @buffer = {}

    @jimpImage = {
      bitmap: {
        width: 40
        height: 40
      }
      crop: sinon.stub()
      getBuffer: sinon.stub().resolves(@buffer)
      getMIME: -> "image/png"
      hash: sinon.stub().returns("image hash")
      clone: => @jimpImage
    }

    Jimp.prototype.composite = sinon.stub()
    Jimp.prototype.getBuffer = sinon.stub().resolves(@buffer)

    config.get(@todosPath).then (@config) =>

  afterEach ->
    Fixtures.remove()

  context ".capture", ->
    beforeEach ->
      @getPixelColor = sinon.stub()
      @getPixelColor.withArgs(0, 0).returns("grey")
      @getPixelColor.withArgs(1, 0).returns("white")
      @getPixelColor.withArgs(0, 1).returns("white")
      @getPixelColor.withArgs(40, 0).returns("white")
      @getPixelColor.withArgs(0, 40).returns("white")
      @getPixelColor.withArgs(40, 40).returns("black")
      @jimpImage.getPixelColor = @getPixelColor

      sinon.stub(Jimp, "read").resolves(@jimpImage)
      intToRGBA = sinon.stub(Jimp, "intToRGBA")
      intToRGBA.withArgs("black").returns({ r: 0, g: 0, b: 0 })
      intToRGBA.withArgs("grey").returns({ r: 127, g: 127, b: 127 })
      intToRGBA.withArgs("white").returns({ r: 255, g: 255, b: 255 })

      @automate = sinon.stub().resolves(image)

      @passPixelTest = =>
        @getPixelColor.withArgs(0, 0).returns("white")

    it "captures screenshot with automation", ->
      data = { viewport: {} }
      screenshots.capture(data, @automate).then =>
        expect(@automate).to.be.calledOnce
        expect(@automate).to.be.calledWith(data)

    it "retries until helper pixels are no longer present for app capture", ->
      @getPixelColor.withArgs(0, 0).onCall(1).returns("white")
      screenshots.capture(@appData, @automate).then =>
        expect(@automate).to.be.calledTwice

    it "retries until helper pixels are present for runner capture", ->
      @passPixelTest()
      @getPixelColor.withArgs(0, 0).onCall(1).returns("black")
      screenshots.capture({ viewport: {} }, @automate).then =>
        expect(@automate).to.be.calledTwice

    it "gives up after 10 tries", ->
      screenshots.capture(@appData, @automate).then =>
        expect(@automate.callCount).to.equal(10)

    it "adjusts cropping based on pixel ratio", ->
      @appData.viewport = { width: 20, height: 20 }
      @appData.clip = { x: 5, y: 5, width: 10, height: 10 }
      @passPixelTest()
      screenshots.capture(@appData, @automate).then =>
        expect(@jimpImage.crop).to.be.calledWith(10, 10, 20, 20)

    it "resolves details w/ image", ->
      @passPixelTest()

      screenshots.capture(@appData, @automate).then (details) =>
        expect(details.image).to.equal(@jimpImage)
        expect(details.multipart).to.be.false
        expect(details.pixelRatio).to.equal(1)
        expect(details.takenAt).to.match(iso8601Regex)

    describe "simple capture", ->
      beforeEach ->
        @appData.simple = true

      it "skips pixel checking / reading into Jimp image", ->
        screenshots.capture(@appData, @automate).then ->
          expect(Jimp.read).not.to.be.called

      it "resolves details w/ buffer", ->
        screenshots.capture(@appData, @automate).then (details) ->
          expect(details.takenAt).to.match(iso8601Regex)
          expect(details.multipart).to.be.false
          expect(details.buffer).to.be.instanceOf(Buffer)

    describe "userClip", ->
      it "crops final image if userClip specified", ->
        @appData.userClip = { width: 5, height: 5, x: 2, y: 2 }
        @passPixelTest()
        screenshots.capture(@appData, @automate).then =>
          expect(@jimpImage.crop).to.be.calledWith(2, 2, 5, 5)

      it "does not crop intermediary multi-part images", ->
        @appData.userClip = { width: 5, height: 5, x: 2, y: 2 }
        @appData.current = 1
        @appData.total = 3
        @passPixelTest()
        screenshots.capture(@appData, @automate).then =>
          expect(@jimpImage.crop).not.to.be.called

      it "adjusts cropping based on pixel ratio", ->
        @appData.viewport = { width: 20, height: 20 }
        @appData.userClip = { x: 5, y: 5, width: 10, height: 10 }
        @passPixelTest()
        screenshots.capture(@appData, @automate).then =>
          expect(@jimpImage.crop).to.be.calledWith(10, 10, 20, 20)

    describe "multi-part capture (fullpage or element)", ->
      beforeEach ->
        screenshots.clearMultipartState()

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

      it "resolves no image on non-last captures", ->
        screenshots.capture(@appData, @automate).then (image) ->
          expect(image).to.be.null

      it "resolves details w/ image on last capture", ->
        screenshots.capture(@appData, @automate)
        .then =>
          @appData.current = 3
          screenshots.capture(@appData, @automate)
        .then ({ image }) =>
          expect(image).to.be.an.instanceOf(Jimp)

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
          expect(composite.getCall(1).args[2]).to.equal(40)
          expect(composite.getCall(2).args[0]).to.equal(@jimpImage)
          expect(composite.getCall(2).args[2]).to.equal(80)

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
      screenshots.crop(@jimpImage, @dimensions())
      expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 10)

    it "crops to dimension size if less than the image size", ->
      screenshots.crop(@jimpImage, @dimensions())
      expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 10)

    it "crops to one less than width if dimensions x is more than the image width", ->
      screenshots.crop(@jimpImage, @dimensions({ x: 50 }))
      expect(@jimpImage.crop).to.be.calledWith(39, 0, 1, 10)

    it "crops to one less than height if dimensions y is more than the image height", ->
      screenshots.crop(@jimpImage, @dimensions({ y: 50 }))
      expect(@jimpImage.crop).to.be.calledWith(0, 39, 10, 1)

    it "crops only width if dimensions height is more than the image height", ->
      screenshots.crop(@jimpImage, @dimensions({ height: 50 }))
      expect(@jimpImage.crop).to.be.calledWith(0, 0, 10, 40)

    it "crops only height if dimensions width is more than the image width", ->
      screenshots.crop(@jimpImage, @dimensions({ width: 50 }))
      expect(@jimpImage.crop).to.be.calledWith(0, 0, 40, 10)

  context ".save", ->
    it "outputs file and returns details", ->
      details = {
        image: @jimpImage
        multipart: false
        pixelRatio: 2
        takenAt: "taken:at:date"
      }

      screenshots.save({name: "foo/tweet"}, details, @config.screenshotsFolder)
      .then (result) =>
        expectedPath = path.normalize(@config.screenshotsFolder + "/footweet.png")
        actualPath = path.normalize(result.path)

        expect(actualPath).to.eq(expectedPath)
        expect(result.size).to.eq("15 B")
        expect(result.dimensions).to.eql({ width: 40, height: 40 })
        expect(result.multipart).to.be.false
        expect(result.pixelRatio).to.be.eq(2)
        expect(result.takenAt).to.eq("taken:at:date")

        fs.statAsync(expectedPath)

    it "can handle saving buffer", ->
      details = {
        multipart: false
        pixelRatio: 1
        buffer: dataUriToBuffer(image)
      }
      dimensions = sizeOf(details.buffer)
      screenshots.save({name: "bar/tweet"}, details, @config.screenshotsFolder)
      .then (result) =>
        expectedPath = path.normalize(@config.screenshotsFolder + "/bartweet.png")
        actualPath = path.normalize(result.path)

        expect(result.multipart).to.be.false
        expect(result.pixelRatio).to.equal(1)
        expect(actualPath).to.eq(expectedPath)
        expect(result.dimensions).to.eql(dimensions)

        fs.statAsync(expectedPath)

  context ".copy", ->
    it "doesnt yell over ENOENT errors", ->
      screenshots.copy("/does/not/exist", "/foo/bar/baz")

    it "copies src to des with {overwrite: true}", ->
      sinon.stub(fs, "copyAsync").withArgs("foo", "bar", {overwrite: true}).resolves()

      screenshots.copy("foo", "bar")

describe "lib/automation/screenshot", ->
  beforeEach ->
    @image = {}
    sinon.stub(screenshots, "capture").resolves(@image)
    sinon.stub(screenshots, "save")

    @screenshot = screenshotAutomation("cypress/screenshots")

  it "captures screenshot", ->
    data = {}
    automation = ->
    @screenshot.capture(data, automation).then ->
      expect(screenshots.capture).to.be.calledWith(data, automation)

  it "saves screenshot if there's a buffer", ->
    data = {}
    @screenshot.capture(data, @automate).then =>
      expect(screenshots.save).to.be.calledWith(data, @image, "cypress/screenshots")

  it "does not save screenshot if there's no buffer", ->
    screenshots.capture.resolves(null)
    @screenshot.capture({}, @automate).then =>
      expect(screenshots.save).not.to.be.called

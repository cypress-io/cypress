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
    ## make each test timeout after only 1 sec
    ## so that durations are handled correctly
    @currentTest.timeout(1000)

    Fixtures.scaffold()
    @todosPath = Fixtures.projectPath("todos")

    @appData = {
      capture: "viewport"
      clip: { x: 0, y: 0, width: 10, height: 10 }
      viewport: { width: 40, height: 40 }
    }

    @buffer = new Buffer("image 1 data buffer")

    @jimpImage = {
      id: 1
      bitmap: {
        width: 40
        height: 40
        data: @buffer
      }
      crop: sinon.stub().callsFake => @jimpImage
      getBuffer: sinon.stub().resolves(@buffer)
      getMIME: -> "image/png"
      hash: sinon.stub().returns("image hash")
      clone: => @jimpImage
    }

    Jimp.prototype.composite = sinon.stub()
    # Jimp.prototype.getBuffer = sinon.stub().resolves(@buffer)

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
      data = { viewport: @jimpImage.bitmap }
      screenshots.capture(data, @automate).then =>
        expect(@automate).to.be.calledOnce
        expect(@automate).to.be.calledWith(data)

    it "retries until helper pixels are no longer present for viewport capture", ->
      @getPixelColor.withArgs(0, 0).onCall(1).returns("white")
      screenshots.capture(@appData, @automate).then =>
        expect(@automate).to.be.calledTwice

    it "retries until helper pixels are present for runner capture", ->
      @passPixelTest()
      @getPixelColor.withArgs(0, 0).onCall(1).returns("black")
      screenshots.capture({ viewport: @jimpImage.bitmap }, @automate)
      .then =>
        expect(@automate).to.be.calledTwice

    it "adjusts cropping based on pixel ratio", ->
      @appData.viewport = { width: 20, height: 20 }
      @appData.clip = { x: 5, y: 5, width: 10, height: 10 }
      @passPixelTest()
      @getPixelColor.withArgs(2, 0).returns("white")
      @getPixelColor.withArgs(0, 2).returns("white")
      screenshots.capture(@appData, @automate)
      .then =>
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
        @getPixelColor.withArgs(2, 0).returns("white")
        @getPixelColor.withArgs(0, 2).returns("white")
        screenshots.capture(@appData, @automate).then =>
          expect(@jimpImage.crop).to.be.calledWith(10, 10, 20, 20)

    describe "multi-part capture (fullPage or element)", ->
      beforeEach ->
        screenshots.clearMultipartState()

        @appData.current = 1
        @appData.total = 3

        @getPixelColor.withArgs(0, 0).onSecondCall().returns("white")

        clone = (img, props) ->
          _.defaultsDeep(props, img)

        @jimpImage2 = clone(@jimpImage, {
          id: 2
          bitmap: {
            data: new Buffer("image 2 data buffer")
          }
        })

        @jimpImage3 = clone(@jimpImage, {
          id: 3
          bitmap: {
            data: new Buffer("image 3 data buffer")
          }
        })

        @jimpImage4 = clone(@jimpImage, {
          id: 4
          bitmap: {
            data: new Buffer("image 4 data buffer")
          }
        })

      it "retries until helper pixels are no longer present on first capture", ->
        screenshots.capture(@appData, @automate)
        .then =>
          expect(@automate).to.be.calledTwice

      it "retries until images aren't the same on subsequent captures", ->
        screenshots.capture(@appData, @automate)
        .then =>
          Jimp.read.onCall(3).resolves(@jimpImage2)

          @appData.current = 2
          screenshots.capture(@appData, @automate)
        .then =>
          expect(@automate.callCount).to.equal(4)

      it "resolves no image on non-last captures", ->
        screenshots.capture(@appData, @automate)
        .then (image) ->
          expect(image).to.be.null

      it "resolves details w/ image on last capture", ->
        screenshots.capture(@appData, @automate)
        .then =>
          Jimp.read.onCall(3).resolves(@jimpImage2)

          @appData.current = 3
          screenshots.capture(@appData, @automate)
        .then ({ image }) =>
          expect(image).to.be.an.instanceOf(Jimp)

      it "composites images into one image", ->
        Jimp.read.onThirdCall().resolves(@jimpImage2)
        Jimp.read.onCall(3).resolves(@jimpImage3)

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
        @getPixelColor.withArgs(0, 0).returns("white")

        Jimp.read.onSecondCall().resolves(@jimpImage2)
        Jimp.read.onThirdCall().resolves(@jimpImage3)
        Jimp.read.onCall(3).resolves(@jimpImage4)

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

    describe "integration", ->
      beforeEach ->
        screenshots.clearMultipartState()

        @currentTest.timeout(10000)

        sinon.restore()

        @data1 = {
          titles: [ 'cy.screenshot() - take a screenshot' ],
          testId: 'r2',
          name: 'app-screenshot',
          capture: 'fullPage',
          clip: { x: 0, y: 0, width: 1000, height: 646 },
          viewport: { width: 1280, height: 646 },
          current: 1,
          total: 3
        }

        @data2 = {
          titles: [ 'cy.screenshot() - take a screenshot' ],
          testId: 'r2',
          name: 'app-screenshot',
          capture: 'fullPage',
          clip: { x: 0, y: 0, width: 1000, height: 646 },
          viewport: { width: 1280, height: 646 },
          current: 2,
          total: 3
        }

        @data3 = {
          titles: [ 'cy.screenshot() - take a screenshot' ],
          testId: 'r2',
          name: 'app-screenshot',
          capture: 'fullPage',
          clip: { x: 0, y: 138, width: 1000, height: 508 },
          viewport: { width: 1280, height: 646 },
          current: 3,
          total: 3
        }

        @dataUri = (img) ->
          return ->
            fs.readFileAsync(Fixtures.path("img/#{img}"))
            .then (buf) ->
              "data:image/png;base64," + buf.toString("base64")

      it "stiches together 1x DPI images", ->
        screenshots
        .capture(@data1, @dataUri("DPI-1x/1.png"))
        .then (img1) =>
          expect(img1).to.be.null

          screenshots
          .capture(@data2, @dataUri("DPI-1x/2.png"))
        .then (img2) =>
          expect(img2).to.be.null

          screenshots
          .capture(@data3, @dataUri("DPI-1x/3.png"))
        .then (img3) =>
          Jimp.read(Fixtures.path("img/DPI-1x/stitched.png"))
          .then (img) =>
            expect(screenshots.imagesMatch(img, img3.image))

      it "stiches together 2x DPI images", ->
        screenshots
        .capture(@data1, @dataUri("DPI-2x/1.png"))
        .then (img1) =>
          expect(img1).to.be.null

          screenshots
          .capture(@data2, @dataUri("DPI-2x/2.png"))
        .then (img2) =>
          expect(img2).to.be.null

          screenshots
          .capture(@data3, @dataUri("DPI-2x/3.png"))
        .then (img3) =>
          Jimp.read(Fixtures.path("img/DPI-2x/stitched.png"))
          .then (img) =>
            expect(screenshots.imagesMatch(img, img3.image))

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
      buf = dataUriToBuffer(image)

      Jimp.read(buf)
      .then (i) =>
        details = {
          image: i
          multipart: false
          pixelRatio: 2
          takenAt: "1234-date"
        }

        dimensions = sizeOf(buf)

        screenshots.save(
          { name: "foo bar\\baz%/my-$screenshot", specName: "foo.spec.js", testFailure: false },
          details,
          @config.screenshotsFolder
        )
        .then (result) =>
          expectedPath = path.join(
            @config.screenshotsFolder, "foo.spec.js", "foo bar", "baz", "my-screenshot.png"
          )

          actualPath = path.normalize(result.path)

          expect(result).to.deep.eq({
            multipart: false
            pixelRatio: 2
            path: path.normalize(result.path)
            size: 284
            name: "foo bar\\baz%/my-$screenshot"
            specName: "foo.spec.js"
            testFailure: false
            takenAt: "1234-date"
            dimensions: _.pick(dimensions, "width", "height")
          })

          expect(expectedPath).to.eq(actualPath)

          fs.statAsync(expectedPath)

    it "can handle saving buffer", ->
      details = {
        multipart: false
        pixelRatio: 1
        buffer: dataUriToBuffer(image)
        takenAt: "1234-date"
      }

      dimensions = sizeOf(details.buffer)

      screenshots.save(
        { name: "with-buffer", specName: "foo.spec.js", testFailure: false },
        details,
        @config.screenshotsFolder
      )
      .then (result) =>
        expectedPath = path.join(
          @config.screenshotsFolder, "foo.spec.js", "with-buffer.png"
        )

        actualPath = path.normalize(result.path)

        expect(result).to.deep.eq({
          name: "with-buffer"
          multipart: false
          pixelRatio: 1
          path: path.normalize(result.path)
          size: 279
          specName: "foo.spec.js"
          testFailure: false
          takenAt: "1234-date"
          dimensions: _.pick(dimensions, "width", "height")
        })

        expect(expectedPath).to.eq(actualPath)

        fs.statAsync(expectedPath)

  context ".copy", ->
    it "doesnt yell over ENOENT errors", ->
      screenshots.copy("/does/not/exist", "/foo/bar/baz")

    it "copies src to des with {overwrite: true}", ->
      sinon.stub(fs, "copyAsync").withArgs("foo", "bar", {overwrite: true}).resolves()

      screenshots.copy("foo", "bar")

  context ".getPath", ->
    it "concats spec name, screenshotsFolder, and name", ->
      p = screenshots.getPath({
        specName: "examples$/user/list.js"
        titles: ["bar", "baz"]
        name: "quux/lorem*"
      }, "png", "path/to/screenshots")

      expect(p).to.eq(
        "path/to/screenshots/examples$/user/list.js/quux/lorem.png"
      )

      p2 = screenshots.getPath({
        specName: "examples$/user/list.js"
        titles: ["bar", "baz"]
        name: "quux*"
        takenPaths: ["path/to/screenshots/examples$/user/list.js/quux.png"]
      }, "png", "path/to/screenshots")

      expect(p2).to.eq(
        "path/to/screenshots/examples$/user/list.js/quux (1).png"
      )

    it "concats spec name, screenshotsFolder, and titles", ->
      p = screenshots.getPath({
        specName: "examples$/user/list.js"
        titles: ["bar", "baz^"]
        takenPaths: ["a"]
        testFailure: true
      }, "png", "path/to/screenshots")

      expect(p).to.eq(
        "path/to/screenshots/examples$/user/list.js/bar -- baz (failed).png"
      )

      p2 = screenshots.getPath({
        specName: "examples$/user/list.js"
        titles: ["bar", "baz^"]
        takenPaths: ["path/to/screenshots/examples$/user/list.js/bar -- baz.png"]
      }, "png", "path/to/screenshots")

      expect(p2).to.eq(
        "path/to/screenshots/examples$/user/list.js/bar -- baz (1).png"
      )

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

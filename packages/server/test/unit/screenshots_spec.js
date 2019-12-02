/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const _           = require("lodash");
const path        = require("path");
const Jimp        = require("jimp");
const { Buffer }      = require("buffer");
const dataUriToBuffer = require("data-uri-to-buffer");
const sizeOf      = require("image-size");
const Fixtures    = require("../support/helpers/fixtures");
const config      = require(`${root}lib/config`);
const screenshots = require(`${root}lib/screenshots`);
const fs          = require(`${root}lib/util/fs`);
const settings    = require(`${root}lib/util/settings`);
const plugins     = require(`${root}lib/plugins`);
const screenshotAutomation = require(`${root}lib/automation/screenshot`);

const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAALlJREFUeNpi1F3xYAIDA4MBA35wgQWqyB5dRoaVmeHJ779wPhOM0aQtyBAoyglmOwmwM6z1lWY44CMDFgcBFmRTGp3EGGJe/WIQ5mZm4GRlBGJmhlm3PqGaeODpNzCtKsbGIARUCALvvv6FWw9XeOvrH4bbQNOQwfabnzHdGK3AwyAjyAqX2HPzC0Pn7Y9wPtyNIMGlD74wmAqwMZz+8AvFxzATVZAFQIqwABWQiWtgAY5uCnKAAwQYAPr8OZysiz4PAAAAAElFTkSuQmCC";
const iso8601Regex = /^\d{4}\-\d{2}\-\d{2}T\d{2}\:\d{2}\:\d{2}\.?\d*Z?$/;

describe("lib/screenshots", function() {
  beforeEach(function() {
    //# make each test timeout after only 1 sec
    //# so that durations are handled correctly
    this.currentTest.timeout(1000);

    Fixtures.scaffold();
    this.todosPath = Fixtures.projectPath("todos");

    this.appData = {
      capture: "viewport",
      clip: { x: 0, y: 0, width: 10, height: 10 },
      viewport: { width: 40, height: 40 }
    };

    this.buffer = Buffer.from("image 1 data buffer");

    this.jimpImage = {
      id: 1,
      bitmap: {
        width: 40,
        height: 40,
        data: this.buffer
      },
      crop: sinon.stub().callsFake(() => this.jimpImage),
      getBuffer: sinon.stub().resolves(this.buffer),
      getMIME() { return "image/png"; },
      hash: sinon.stub().returns("image hash"),
      clone: () => this.jimpImage
    };

    Jimp.prototype.composite = sinon.stub();
    // Jimp.prototype.getBuffer = sinon.stub().resolves(@buffer)

    return config.get(this.todosPath).then(config1 => {
      this.config = config1;
      
  });
  });

  afterEach(() => Fixtures.remove());

  context(".capture", function() {
    beforeEach(function() {
      this.getPixelColor = sinon.stub();
      this.getPixelColor.withArgs(0, 0).returns("grey");
      this.getPixelColor.withArgs(1, 0).returns("white");
      this.getPixelColor.withArgs(0, 1).returns("white");
      this.getPixelColor.withArgs(40, 0).returns("white");
      this.getPixelColor.withArgs(0, 40).returns("white");
      this.getPixelColor.withArgs(40, 40).returns("black");
      this.jimpImage.getPixelColor = this.getPixelColor;

      sinon.stub(Jimp, "read").resolves(this.jimpImage);
      const intToRGBA = sinon.stub(Jimp, "intToRGBA");
      intToRGBA.withArgs("black").returns({ r: 0, g: 0, b: 0 });
      intToRGBA.withArgs("grey").returns({ r: 127, g: 127, b: 127 });
      intToRGBA.withArgs("white").returns({ r: 255, g: 255, b: 255 });

      this.automate = sinon.stub().resolves(image);

      return this.passPixelTest = () => {
        return this.getPixelColor.withArgs(0, 0).returns("white");
      };
    });

    it("captures screenshot with automation", function() {
      const data = { viewport: this.jimpImage.bitmap };
      return screenshots.capture(data, this.automate).then(() => {
        expect(this.automate).to.be.calledOnce;
        return expect(this.automate).to.be.calledWith(data);
      });
    });

    it("retries until helper pixels are no longer present for viewport capture", function() {
      this.getPixelColor.withArgs(0, 0).onCall(1).returns("white");
      return screenshots.capture(this.appData, this.automate).then(() => {
        return expect(this.automate).to.be.calledTwice;
      });
    });

    it("retries until helper pixels are present for runner capture", function() {
      this.passPixelTest();
      this.getPixelColor.withArgs(0, 0).onCall(1).returns("black");
      return screenshots.capture({ viewport: this.jimpImage.bitmap }, this.automate)
      .then(() => {
        return expect(this.automate).to.be.calledTwice;
      });
    });

    it("adjusts cropping based on pixel ratio", function() {
      this.appData.viewport = { width: 20, height: 20 };
      this.appData.clip = { x: 5, y: 5, width: 10, height: 10 };
      this.passPixelTest();
      this.getPixelColor.withArgs(2, 0).returns("white");
      this.getPixelColor.withArgs(0, 2).returns("white");
      return screenshots.capture(this.appData, this.automate)
      .then(() => {
        return expect(this.jimpImage.crop).to.be.calledWith(10, 10, 20, 20);
      });
    });

    it("resolves details w/ image", function() {
      this.passPixelTest();

      return screenshots.capture(this.appData, this.automate).then(details => {
        expect(details.image).to.equal(this.jimpImage);
        expect(details.multipart).to.be.false;
        expect(details.pixelRatio).to.equal(1);
        return expect(details.takenAt).to.match(iso8601Regex);
      });
    });

    describe("simple capture", function() {
      beforeEach(function() {
        return this.appData.simple = true;
      });

      it("skips pixel checking / reading into Jimp image", function() {
        return screenshots.capture(this.appData, this.automate).then(() => expect(Jimp.read).not.to.be.called);
      });

      return it("resolves details w/ buffer", function() {
        return screenshots.capture(this.appData, this.automate).then(function(details) {
          expect(details.takenAt).to.match(iso8601Regex);
          expect(details.multipart).to.be.false;
          return expect(details.buffer).to.be.instanceOf(Buffer);
        });
      });
    });

    describe("userClip", function() {
      it("crops final image if userClip specified", function() {
        this.appData.userClip = { width: 5, height: 5, x: 2, y: 2 };
        this.passPixelTest();
        return screenshots.capture(this.appData, this.automate).then(() => {
          return expect(this.jimpImage.crop).to.be.calledWith(2, 2, 5, 5);
        });
      });

      it("does not crop intermediary multi-part images", function() {
        this.appData.userClip = { width: 5, height: 5, x: 2, y: 2 };
        this.appData.current = 1;
        this.appData.total = 3;
        this.passPixelTest();
        return screenshots.capture(this.appData, this.automate).then(() => {
          return expect(this.jimpImage.crop).not.to.be.called;
        });
      });

      return it("adjusts cropping based on pixel ratio", function() {
        this.appData.viewport = { width: 20, height: 20 };
        this.appData.userClip = { x: 5, y: 5, width: 10, height: 10 };
        this.passPixelTest();
        this.getPixelColor.withArgs(2, 0).returns("white");
        this.getPixelColor.withArgs(0, 2).returns("white");
        return screenshots.capture(this.appData, this.automate).then(() => {
          return expect(this.jimpImage.crop).to.be.calledWith(10, 10, 20, 20);
        });
      });
    });

    describe("multi-part capture (fullPage or element)", function() {
      beforeEach(function() {
        screenshots.clearMultipartState();

        this.appData.current = 1;
        this.appData.total = 3;

        this.getPixelColor.withArgs(0, 0).onSecondCall().returns("white");

        const clone = (img, props) => _.defaultsDeep(props, img);

        this.jimpImage2 = clone(this.jimpImage, {
          id: 2,
          bitmap: {
            data: Buffer.from("image 2 data buffer")
          }
        });

        this.jimpImage3 = clone(this.jimpImage, {
          id: 3,
          bitmap: {
            data: Buffer.from("image 3 data buffer")
          }
        });

        return this.jimpImage4 = clone(this.jimpImage, {
          id: 4,
          bitmap: {
            data: Buffer.from("image 4 data buffer")
          }
        });
      });

      it("retries until helper pixels are no longer present on first capture", function() {
        return screenshots.capture(this.appData, this.automate)
        .then(() => {
          return expect(this.automate).to.be.calledTwice;
        });
      });

      it("retries until images aren't the same on subsequent captures", function() {
        return screenshots.capture(this.appData, this.automate)
        .then(() => {
          Jimp.read.onCall(3).resolves(this.jimpImage2);

          this.appData.current = 2;
          return screenshots.capture(this.appData, this.automate);
      }).then(() => {
          return expect(this.automate.callCount).to.equal(4);
        });
      });

      it("resolves no image on non-last captures", function() {
        return screenshots.capture(this.appData, this.automate)
        .then(image => expect(image).to.be.null);
      });

      it("resolves details w/ image on last capture", function() {
        return screenshots.capture(this.appData, this.automate)
        .then(() => {
          Jimp.read.onCall(3).resolves(this.jimpImage2);

          this.appData.current = 3;
          return screenshots.capture(this.appData, this.automate);
      }).then(({ image }) => {
          return expect(image).to.be.an.instanceOf(Jimp);
        });
      });

      it("composites images into one image", function() {
        Jimp.read.onThirdCall().resolves(this.jimpImage2);
        Jimp.read.onCall(3).resolves(this.jimpImage3);

        return screenshots.capture(this.appData, this.automate)
        .then(() => {
          this.appData.current = 2;
          return screenshots.capture(this.appData, this.automate);
      }).then(() => {
          this.appData.current = 3;
          return screenshots.capture(this.appData, this.automate);
        }).then(() => {
          const { composite } = Jimp.prototype;
          expect(composite).to.be.calledThrice;
          expect(composite.getCall(0).args[0]).to.equal(this.jimpImage);
          expect(composite.getCall(0).args[1]).to.equal(0);
          expect(composite.getCall(0).args[2]).to.equal(0);
          expect(composite.getCall(1).args[0]).to.equal(this.jimpImage);
          expect(composite.getCall(1).args[2]).to.equal(40);
          expect(composite.getCall(2).args[0]).to.equal(this.jimpImage);
          return expect(composite.getCall(2).args[2]).to.equal(80);
        });
      });

      it("clears previous full page state once complete", function() {
        this.getPixelColor.withArgs(0, 0).returns("white");

        Jimp.read.onSecondCall().resolves(this.jimpImage2);
        Jimp.read.onThirdCall().resolves(this.jimpImage3);
        Jimp.read.onCall(3).resolves(this.jimpImage4);

        this.appData.total = 2;
        return screenshots.capture(this.appData, this.automate)
        .then(() => {
          this.appData.current = 2;
          return screenshots.capture(this.appData, this.automate);
      }).then(() => {
          this.appData.current = 1;
          return screenshots.capture(this.appData, this.automate);
        }).then(() => {
          this.appData.current = 2;
          return screenshots.capture(this.appData, this.automate);
        }).then(() => expect(Jimp.prototype.composite.callCount).to.equal(4));
      });

      return it("skips full page process if only one capture needed", function() {
        this.appData.total = 1;
        return screenshots.capture(this.appData, this.automate)
        .then(() => expect(Jimp.prototype.composite).not.to.be.called);
      });
    });

    return describe("integration", function() {
      beforeEach(function() {
        screenshots.clearMultipartState();

        this.currentTest.timeout(10000);

        sinon.restore();

        this.data1 = {
          titles: [ 'cy.screenshot() - take a screenshot' ],
          testId: 'r2',
          name: 'app-screenshot',
          capture: 'fullPage',
          clip: { x: 0, y: 0, width: 1000, height: 646 },
          viewport: { width: 1280, height: 646 },
          current: 1,
          total: 3
        };

        this.data2 = {
          titles: [ 'cy.screenshot() - take a screenshot' ],
          testId: 'r2',
          name: 'app-screenshot',
          capture: 'fullPage',
          clip: { x: 0, y: 0, width: 1000, height: 646 },
          viewport: { width: 1280, height: 646 },
          current: 2,
          total: 3
        };

        this.data3 = {
          titles: [ 'cy.screenshot() - take a screenshot' ],
          testId: 'r2',
          name: 'app-screenshot',
          capture: 'fullPage',
          clip: { x: 0, y: 138, width: 1000, height: 508 },
          viewport: { width: 1280, height: 646 },
          current: 3,
          total: 3
        };

        return this.dataUri = img =>
          () =>
            fs.readFileAsync(Fixtures.path(`img/${img}`))
            .then(buf => `data:image/png;base64,${buf.toString("base64")}`)
          
        ;
      });

      it("stiches together 1x DPI images", function() {
        return screenshots
        .capture(this.data1, this.dataUri("DPI-1x/1.png"))
        .then(img1 => {
          expect(img1).to.be.null;

          return screenshots
          .capture(this.data2, this.dataUri("DPI-1x/2.png"));
      }).then(img2 => {
          expect(img2).to.be.null;

          return screenshots
          .capture(this.data3, this.dataUri("DPI-1x/3.png"));
        }).then(img3 => {
          return Jimp.read(Fixtures.path("img/DPI-1x/stitched.png"))
          .then(img => {
            return expect(screenshots.imagesMatch(img, img3.image));
          });
        });
      });

      return it("stiches together 2x DPI images", function() {
        return screenshots
        .capture(this.data1, this.dataUri("DPI-2x/1.png"))
        .then(img1 => {
          expect(img1).to.be.null;

          return screenshots
          .capture(this.data2, this.dataUri("DPI-2x/2.png"));
      }).then(img2 => {
          expect(img2).to.be.null;

          return screenshots
          .capture(this.data3, this.dataUri("DPI-2x/3.png"));
        }).then(img3 => {
          return Jimp.read(Fixtures.path("img/DPI-2x/stitched.png"))
          .then(img => {
            return expect(screenshots.imagesMatch(img, img3.image));
          });
        });
      });
    });
  });

  context(".crop", function() {
    beforeEach(function() {
      return this.dimensions = overrides => _.extend({ x: 0, y: 0, width: 10, height: 10 }, overrides);
    });

    it("crops to dimension size if less than the image size", function() {
      screenshots.crop(this.jimpImage, this.dimensions());
      return expect(this.jimpImage.crop).to.be.calledWith(0, 0, 10, 10);
    });

    it("crops to dimension size if less than the image size", function() {
      screenshots.crop(this.jimpImage, this.dimensions());
      return expect(this.jimpImage.crop).to.be.calledWith(0, 0, 10, 10);
    });

    it("crops to one less than width if dimensions x is more than the image width", function() {
      screenshots.crop(this.jimpImage, this.dimensions({ x: 50 }));
      return expect(this.jimpImage.crop).to.be.calledWith(39, 0, 1, 10);
    });

    it("crops to one less than height if dimensions y is more than the image height", function() {
      screenshots.crop(this.jimpImage, this.dimensions({ y: 50 }));
      return expect(this.jimpImage.crop).to.be.calledWith(0, 39, 10, 1);
    });

    it("crops only width if dimensions height is more than the image height", function() {
      screenshots.crop(this.jimpImage, this.dimensions({ height: 50 }));
      return expect(this.jimpImage.crop).to.be.calledWith(0, 0, 10, 40);
    });

    return it("crops only height if dimensions width is more than the image width", function() {
      screenshots.crop(this.jimpImage, this.dimensions({ width: 50 }));
      return expect(this.jimpImage.crop).to.be.calledWith(0, 0, 40, 10);
    });
  });

  context(".save", function() {
    it("outputs file and returns details", function() {
      const buf = dataUriToBuffer(image);

      return Jimp.read(buf)
      .then(i => {
        const details = {
          image: i,
          multipart: false,
          pixelRatio: 2,
          takenAt: "1234-date"
        };

        const dimensions = sizeOf(buf);

        return screenshots.save(
          { name: "foo bar\\baz/my-screenshot", specName: "foo.spec.js", testFailure: false },
          details,
          this.config.screenshotsFolder
        )
        .then(result => {
          const expectedPath = path.join(
            this.config.screenshotsFolder, "foo.spec.js", "foo bar", "baz", "my-screenshot.png"
          );

          const actualPath = path.normalize(result.path);

          expect(result).to.deep.eq({
            multipart: false,
            pixelRatio: 2,
            path: path.normalize(result.path),
            size: 272,
            name: "foo bar\\baz/my-screenshot",
            specName: "foo.spec.js",
            testFailure: false,
            takenAt: "1234-date",
            dimensions: _.pick(dimensions, "width", "height")
          });

          expect(expectedPath).to.eq(actualPath);

          return fs.statAsync(expectedPath);
        });
      });
    });

    return it("can handle saving buffer", function() {
      const details = {
        multipart: false,
        pixelRatio: 1,
        buffer: dataUriToBuffer(image),
        takenAt: "1234-date"
      };

      const dimensions = sizeOf(details.buffer);

      return screenshots.save(
        { name: "with-buffer", specName: "foo.spec.js", testFailure: false },
        details,
        this.config.screenshotsFolder
      )
      .then(result => {
        const expectedPath = path.join(
          this.config.screenshotsFolder, "foo.spec.js", "with-buffer.png"
        );

        const actualPath = path.normalize(result.path);

        expect(result).to.deep.eq({
          name: "with-buffer",
          multipart: false,
          pixelRatio: 1,
          path: path.normalize(result.path),
          size: 279,
          specName: "foo.spec.js",
          testFailure: false,
          takenAt: "1234-date",
          dimensions: _.pick(dimensions, "width", "height")
        });

        expect(expectedPath).to.eq(actualPath);

        return fs.statAsync(expectedPath);
      });
    });
  });

  context(".copy", function() {
    it("doesnt yell over ENOENT errors", () => screenshots.copy("/does/not/exist", "/foo/bar/baz"));

    return it("copies src to des with {overwrite: true}", function() {
      sinon.stub(fs, "copyAsync").withArgs("foo", "bar", {overwrite: true}).resolves();

      return screenshots.copy("foo", "bar");
    });
  });

  context(".getPath", function() {
    it("concats spec name, screenshotsFolder, and name", () =>
      screenshots.getPath({
        specName: "examples/user/list.js",
        titles: ["bar", "baz"],
        name: "quux/lorem"
      }, "png", "path/to/screenshots")
      .then(p =>
        expect(p).to.eq(
          "path/to/screenshots/examples/user/list.js/quux/lorem.png"
        )
      )
    );

    it("concats spec name, screenshotsFolder, and titles", () =>
      screenshots.getPath({
        specName: "examples/user/list.js",
        titles: ["bar", "baz"],
        takenPaths: ["a"],
        testFailure: true
      }, "png", "path/to/screenshots")
      .then(p =>
        expect(p).to.eq(
          "path/to/screenshots/examples/user/list.js/bar -- baz (failed).png"
        )
      )
    );

    it("sanitizes file paths", () =>
      screenshots.getPath({
        specName: "examples$/user/list.js",
        titles: ["bar*", "baz..", "語言"],
        takenPaths: ["a"],
        testFailure: true
      }, "png", "path/to/screenshots")
      .then(p =>
        expect(p).to.eq(
          "path/to/screenshots/examples$/user/list.js/bar -- baz -- 語言 (failed).png"
        )
      )
    );

    _.each([Infinity, 0 / 0, [], {}, 1, false], value =>
      it(`doesn't err and stringifies non-string test title: ${value}`, () =>
        screenshots.getPath({
          specName: "examples$/user/list.js",
          titles: ["bar*", "語言", value],
          takenPaths: ["a"],
          testFailure: true
        }, "png", "path/to/screenshots")
        .then(p => expect(p).to.eq(`path/to/screenshots/examples$/user/list.js/bar -- 語言 -- ${value} (failed).png`))
      )
    );

    return _.each([null, undefined], value =>
      it(`doesn't err and removes null/undefined test title: ${value}`, () =>
        screenshots.getPath({
          specName: "examples$/user/list.js",
          titles: ["bar*", "語言", value],
          takenPaths: ["a"],
          testFailure: true
        }, "png", "path/to/screenshots")
        .then(p => expect(p).to.eq("path/to/screenshots/examples$/user/list.js/bar -- 語言 --  (failed).png"))
      )
    );
  });

  return context(".afterScreenshot", function() {
    beforeEach(function() {
      this.data = {
        titles: ["the", "title"],
        testId: "r1",
        name: "my-screenshot",
        capture: "runner",
        clip: { x: 0, y: 0, width: 1000, height: 660 },
        viewport: { width: 1400, height: 700 },
        scaled: true,
        blackout: [],
        startTime: "2018-06-27T20:17:19.537Z",
        specName: "integration/spec.coffee"
      };

      this.details = {
        size: 100,
        takenAt: new Date().toISOString(),
        dimensions: { width: 1000, height: 660 },
        multipart: false,
        pixelRatio: 1,
        name: "my-screenshot",
        specName: "integration/spec.coffee",
        testFailure: true,
        path: "/path/to/my-screenshot.png"
      };

      sinon.stub(plugins, "has");
      return sinon.stub(plugins, "execute");
    });

    it("resolves whitelisted details if no after:screenshot plugin registered", function() {
      plugins.has.returns(false);

      return screenshots.afterScreenshot(this.data, this.details).then(result => {
        expect(_.omit(result, "duration")).to.eql({
          size: 100,
          takenAt: this.details.takenAt,
          dimensions: this.details.dimensions,
          multipart: false,
          pixelRatio: 1,
          name: "my-screenshot",
          specName: "integration/spec.coffee",
          testFailure: true,
          path: "/path/to/my-screenshot.png",
          scaled: true,
          blackout: []
          });
        return expect(result.duration).to.be.a("number");
      });
    });

    it("executes after:screenshot plugin and merges in size, dimensions, and/or path", function() {
      plugins.has.returns(true);
      plugins.execute.resolves({
        size: 200,
        dimensions: { width: 2000, height: 1320 },
        path: "/new/path/to/screenshot.png",
        pixelRatio: 2,
        takenAt: "1234"
      });

      return screenshots.afterScreenshot(this.data, this.details).then(result => {
        expect(_.omit(result, "duration")).to.eql({
          size: 200,
          takenAt: this.details.takenAt,
          dimensions: { width: 2000, height: 1320 },
          multipart: false,
          pixelRatio: 1,
          name: "my-screenshot",
          specName: "integration/spec.coffee",
          testFailure: true,
          path: "/new/path/to/screenshot.png",
          scaled: true,
          blackout: []
        });
        return expect(result.duration).to.be.a("number");
      });
    });

    return it("ignores updates that are not an object", function() {
      plugins.execute.resolves("foo");

      return screenshots.afterScreenshot(this.data, this.details).then(result => {
        expect(_.omit(result, "duration")).to.eql({
          size: 100,
          takenAt: this.details.takenAt,
          dimensions: this.details.dimensions,
          multipart: false,
          pixelRatio: 1,
          name: "my-screenshot",
          specName: "integration/spec.coffee",
          testFailure: true,
          path: "/path/to/my-screenshot.png",
          scaled: true,
          blackout: []
          });
        return expect(result.duration).to.be.a("number");
      });
    });
  });
});

describe("lib/automation/screenshot", function() {
  beforeEach(function() {
    this.details = {};
    sinon.stub(screenshots, "capture").resolves(this.details);
    this.savedDetails = {};
    sinon.stub(screenshots, "save").resolves(this.savedDetails);
    this.updatedDetails = {};
    sinon.stub(screenshots, "afterScreenshot").resolves(this.updatedDetails);

    return this.screenshot = screenshotAutomation("cypress/screenshots");
  });

  it("captures screenshot", function() {
    const data = {};
    const automation = function() {};
    return this.screenshot.capture(data, automation).then(() => expect(screenshots.capture).to.be.calledWith(data, automation));
  });

  it("saves screenshot if there's a buffer", function() {
    const data = {};
    return this.screenshot.capture(data, this.automate).then(() => {
      return expect(screenshots.save).to.be.calledWith(data, this.details, "cypress/screenshots");
    });
  });

  it("does not save screenshot if there's no buffer", function() {
    screenshots.capture.resolves(null);
    return this.screenshot.capture({}, this.automate).then(() => {
      return expect(screenshots.save).not.to.be.called;
    });
  });

  it("calls afterScreenshot", function() {
    const data = {};
    return this.screenshot.capture(data, this.automate).then(() => {
      return expect(screenshots.afterScreenshot).to.be.calledWith(data, this.savedDetails);
    });
  });

  return it("resolves with updated details", function() {
    return this.screenshot.capture({}, this.automate).then(details => {
      return expect(details).to.equal(this.updatedDetails);
    });
  });
});

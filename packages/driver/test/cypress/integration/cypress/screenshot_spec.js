{ Screenshot, $ } = Cypress

DEFAULTS = {
  capture: "fullPage"
  scale: false
  disableTimersAndAnimations: true
  screenshotOnRunFailure: true
  blackout: []
}

describe "src/cypress/screenshot", ->
  beforeEach ->
    ## reset state since this is a singleton
    Screenshot.reset()

  it "has defaults", ->
    expect(Screenshot.getConfig()).to.deep.eq(DEFAULTS)
    expect(-> Screenshot.onBeforeScreenshot()).not.to.throw()
    expect(-> Screenshot.onAfterScreenshot()).not.to.throw()

  context ".getConfig", ->
    it "returns copy of config", ->
      config = Screenshot.getConfig()
      config.blackout.push(".foo")
      expect(Screenshot.getConfig().blackout).to.deep.eq(DEFAULTS.blackout)

  context ".defaults", ->
    it "is noop if not called with any valid properties", ->
      Screenshot.defaults({})
      expect(Screenshot.getConfig()).to.deep.eq(DEFAULTS)
      expect(-> Screenshot.onBeforeScreenshot()).not.to.throw()
      expect(-> Screenshot.onAfterScreenshot()).not.to.throw()

    it "sets capture if specified", ->
      Screenshot.defaults({
        capture: "runner"
      })
      expect(Screenshot.getConfig().capture).to.eql("runner")

    it "sets scale if specified", ->
      Screenshot.defaults({
        scale: true
      })
      expect(Screenshot.getConfig().scale).to.equal(true)

    it "sets disableTimersAndAnimations if specified", ->
      Screenshot.defaults({
        disableTimersAndAnimations: false
      })
      expect(Screenshot.getConfig().disableTimersAndAnimations).to.equal(false)

    it "sets screenshotOnRunFailure if specified", ->
      Screenshot.defaults({
        screenshotOnRunFailure: false
      })
      expect(Screenshot.getConfig().screenshotOnRunFailure).to.equal(false)

    it "sets clip if specified", ->
      Screenshot.defaults({
        clip: { width: 200, height: 100, x: 0, y: 0 }
      })
      expect(
        Screenshot.getConfig().clip
      ).to.eql(
        { width: 200, height: 100, x: 0, y:0 }
      )

    it "sets and normalizes padding if specified", ->
      tests = [
        [ 50, [50, 50, 50, 50] ]
        [ [15], [15, 15, 15, 15] ]
        [ [30, 20], [30, 20, 30, 20] ]
        [ [10, 20, 30], [10, 20, 30, 20] ]
        [ [20, 10, 20, 10], [20, 10, 20, 10] ]
      ]

      for test in tests
        [ input, expected ] = test
        Screenshot.defaults({
          padding: input
        })
        expect(
          Screenshot.getConfig().padding
        ).to.eql(
          expected
        )

    it "sets onBeforeScreenshot if specified", ->
      onBeforeScreenshot = cy.stub()
      Screenshot.defaults({ onBeforeScreenshot })
      Screenshot.onBeforeScreenshot()
      expect(onBeforeScreenshot).to.be.called

    it "sets onAfterScreenshot if specified", ->
      onAfterScreenshot = cy.stub()
      Screenshot.defaults({ onAfterScreenshot })
      Screenshot.onAfterScreenshot()
      expect(onAfterScreenshot).to.be.called

    describe "errors", ->
      it "throws if not passed an object", ->
        fn = () =>
          return Screenshot.defaults()

        expect(fn).to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` must be called with an object. You passed: ``")

        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.include("https://on.cypress.io/screenshot-api")

      it "throws if capture is not a string", ->
        fn = () =>
          return Screenshot.defaults({ capture: true })

        expect(fn).to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` `capture` option must be one of the following: `fullPage`, `viewport`, or `runner`. You passed: `true`")

        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.eq("https://on.cypress.io/screenshot-api")

      it "throws if capture is not a valid option", ->
        fn = () =>
          return Screenshot.defaults({ capture: "foo" })

        expect(fn).to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` `capture` option must be one of the following: `fullPage`, `viewport`, or `runner`. You passed: `foo`")

        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.eq("https://on.cypress.io/screenshot-api")

      it "throws if scale is not a boolean", ->
        fn = () =>
          return Screenshot.defaults({ scale: "foo" })

        expect(fn).to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` `scale` option must be a boolean. You passed: `foo`")
        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.eq("https://on.cypress.io/screenshot-api")

      it "throws if disableTimersAndAnimations is not a boolean", ->
        fn = () =>
          return Screenshot.defaults({ disableTimersAndAnimations: "foo" })

        expect(fn).to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` `disableTimersAndAnimations` option must be a boolean. You passed: `foo`")

        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.eq("https://on.cypress.io/screenshot-api")

      it "throws if screenshotOnRunFailure is not a boolean", ->
        fn = () =>
          return Screenshot.defaults({ screenshotOnRunFailure: "foo" })

        expect(fn).to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` `screenshotOnRunFailure` option must be a boolean. You passed: `foo`")

        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.include("https://on.cypress.io/screenshot-api")

      it "throws if blackout is not an array", ->
        fn = () =>
          return Screenshot.defaults({ blackout: "foo" })

        expect(fn).to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` `blackout` option must be an array of strings. You passed: `foo`")

        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.include("https://on.cypress.io/screenshot-api")

      it "throws if blackout is not an array of strings", ->
        fn = () =>
          return Screenshot.defaults({ blackout: [true] })

        expect(fn).to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` `blackout` option must be an array of strings. You passed: `true`")

        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.include("https://on.cypress.io/screenshot-api")

      it "throws if padding is not a number or an array of numbers with a length between 1 and 4", ->
        expect =>
          Screenshot.defaults({ padding: '50px' })
        .to.throw("`Cypress.Screenshot.defaults()` `padding` option must be either a number or an array of numbers with a maximum length of 4. You passed: `50px`")
        expect =>
          Screenshot.defaults({ padding: ['bad', 'bad', 'bad', 'bad'] })
        .to.throw("`Cypress.Screenshot.defaults()` `padding` option must be either a number or an array of numbers with a maximum length of 4. You passed: `bad, bad, bad, bad`")
        expect =>
          Screenshot.defaults({ padding: [20, 10, 20, 10, 50] })
        .to.throw("`Cypress.Screenshot.defaults()` `padding` option must be either a number or an array of numbers with a maximum length of 4. You passed: `20, 10, 20, 10, 50`")

      it "throws if clip is lacking proper keys", ->
        expect =>
          Screenshot.defaults({ clip: { x: 5 } })
        .to.throw("`Cypress.Screenshot.defaults()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `{x: 5}`")

      it "throws if clip has extraneous keys", ->
        expect =>
          Screenshot.defaults({ clip: { width: 100, height: 100, x: 5, y: 5, foo: 10 } })
        .to.throw("`Cypress.Screenshot.defaults()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `Object{5}`")

      it "throws if clip has non-number values", ->
        expect =>
          Screenshot.defaults({ clip: { width: 100, height: 100, x: 5, y: "5" } })
        .to.throw("`Cypress.Screenshot.defaults()` `clip` option must be an object with the keys `{ width, height, x, y }` and number values. You passed: `Object{4}`")

      it "throws if onBeforeScreenshot is not a function", ->
        fn = () =>
          return Screenshot.defaults({ onBeforeScreenshot: "foo" })

        expect(fn)
        .to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` `onBeforeScreenshot` option must be a function. You passed: `foo`")

        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.include("https://on.cypress.io/screenshot-api")

      it "throws if onAfterScreenshot is not a function", ->
        fn = () =>
          return Screenshot.defaults({ onAfterScreenshot: "foo" })

        expect(fn)
        .to.throw()
        .with.property("message")
        .and.include("`Cypress.Screenshot.defaults()` `onAfterScreenshot` option must be a function. You passed: `foo`")

        expect(fn).to.throw()
        .with.property("docsUrl")
        .and.include("https://on.cypress.io/screenshot-api")

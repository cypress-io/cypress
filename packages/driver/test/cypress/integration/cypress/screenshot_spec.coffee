{ Screenshot, $ } = Cypress

DEFAULTS = {
  capture: "fullpage"
  waitForCommandSynchronization: true
  scaleAppCaptures: false
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
    expect(-> Screenshot.callBeforeScreenshot()).not.to.throw()
    expect(-> Screenshot.callAfterScreenshot()).not.to.throw()

  context ".getConfig", ->
    it "returns copy of config", ->
      config = Screenshot.getConfig()
      config.blackout.push(".foo")
      expect(Screenshot.getConfig().blackout).to.deep.eq(DEFAULTS.blackout)

  context ".defaults", ->
    it "is noop if not called with any valid properties", ->
      Screenshot.defaults({})
      expect(Screenshot.getConfig()).to.deep.eq(DEFAULTS)
      expect(-> Screenshot.callBeforeScreenshot()).not.to.throw()
      expect(-> Screenshot.callAfterScreenshot()).not.to.throw()

    it "sets capture if specified", ->
      Screenshot.defaults({
        capture: "runner"
      })
      expect(Screenshot.getConfig().capture).to.eql("runner")

    it "sets waitForCommandSynchronization if specified", ->
      Screenshot.defaults({
        waitForCommandSynchronization: false
      })
      expect(Screenshot.getConfig().waitForCommandSynchronization).to.equal(false)

    it "sets scaleAppCaptures if specified", ->
      Screenshot.defaults({
        scaleAppCaptures: true
      })
      expect(Screenshot.getConfig().scaleAppCaptures).to.equal(true)

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
      expect(Screenshot.getConfig().clip).to.eql({ width: 200, height: 100, x: 0, y:0 })

    it "sets beforeScreenshot if specified", ->
      beforeScreenshot = cy.stub()
      Screenshot.defaults({ beforeScreenshot })
      Screenshot.callBeforeScreenshot()
      expect(beforeScreenshot).to.be.called

    it "sets afterScreenshot if specified", ->
      afterScreenshot = cy.stub()
      Screenshot.defaults({ afterScreenshot })
      Screenshot.callAfterScreenshot()
      expect(afterScreenshot).to.be.called

    describe "errors", ->
      it "throws if not passed an object", ->
        expect =>
          Screenshot.defaults()
        .to.throw("Cypress.Screenshot.defaults() must be called with an object. You passed: ")

      it "throws if capture is not a string", ->
        expect =>
          Screenshot.defaults({ capture: true })
        .to.throw("Cypress.Screenshot.defaults() 'capture' option must be one of the following: 'app', 'runner', or 'fullpage'. You passed: true")

      it "throws if capture is not a valid option", ->
        expect =>
          Screenshot.defaults({ capture: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'capture' option must be one of the following: 'app', 'runner', or 'fullpage'. You passed: foo")

      it "throws if waitForCommandSynchronization is not a boolean", ->
        expect =>
          Screenshot.defaults({ waitForCommandSynchronization: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'waitForCommandSynchronization' option must be a boolean. You passed: foo")

      it "throws if scaleAppCaptures is not a boolean", ->
        expect =>
          Screenshot.defaults({ scaleAppCaptures: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'scaleAppCaptures' option must be a boolean. You passed: foo")

      it "throws if disableTimersAndAnimations is not a boolean", ->
        expect =>
          Screenshot.defaults({ disableTimersAndAnimations: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'disableTimersAndAnimations' option must be a boolean. You passed: foo")

      it "throws if screenshotOnRunFailure is not a boolean", ->
        expect =>
          Screenshot.defaults({ screenshotOnRunFailure: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'screenshotOnRunFailure' option must be a boolean. You passed: foo")

      it "throws if blackout is not an array", ->
        expect =>
          Screenshot.defaults({ blackout: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'blackout' option must be an array of strings. You passed: foo")

      it "throws if blackout is not an array of strings", ->
        expect =>
          Screenshot.defaults({ blackout: [true] })
        .to.throw("Cypress.Screenshot.defaults() 'blackout' option must be an array of strings. You passed: true")

      it "throws if clip is not an object", ->
        expect =>
          Screenshot.defaults({ clip: true })
        .to.throw("Cypress.Screenshot.defaults() 'clip' option must be an object of with the keys { width, height, x, y } and number values. You passed: true")

      it "throws if clip is lacking proper keys", ->
        expect =>
          Screenshot.defaults({ clip: { x: 5 } })
        .to.throw("Cypress.Screenshot.defaults() 'clip' option must be an object of with the keys { width, height, x, y } and number values. You passed: {x: 5}")

      it "throws if clip has extraneous keys", ->
        expect =>
          Screenshot.defaults({ clip: { width: 100, height: 100, x: 5, y: 5, foo: 10 } })
        .to.throw("Cypress.Screenshot.defaults() 'clip' option must be an object of with the keys { width, height, x, y } and number values. You passed: Object{5}")

      it "throws if clip has non-number values", ->
        expect =>
          Screenshot.defaults({ clip: { width: 100, height: 100, x: 5, y: "5" } })
        .to.throw("Cypress.Screenshot.defaults() 'clip' option must be an object of with the keys { width, height, x, y } and number values. You passed: Object{4}")

      it "throws if beforeScreenshot is not a function", ->
        expect =>
          Screenshot.defaults({ beforeScreenshot: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'beforeScreenshot' option must be a function. You passed: foo")

      it "throws if afterScreenshot is not a function", ->
        expect =>
          Screenshot.defaults({ afterScreenshot: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'afterScreenshot' option must be a function. You passed: foo")

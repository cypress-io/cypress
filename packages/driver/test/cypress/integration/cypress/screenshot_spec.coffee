{ Screenshot, $ } = Cypress

DEFAULTS = {
  capture: ["runner"]
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

  context ".defaults", ->
    it "is noop if not called with any valid properties", ->
      Screenshot.defaults({})
      expect(Screenshot.getConfig()).to.deep.eq(DEFAULTS)
      expect(-> Screenshot.callBeforeScreenshot()).not.to.throw()
      expect(-> Screenshot.callAfterScreenshot()).not.to.throw()

    it "sets capture if specified", ->
      Screenshot.defaults({
        capture: ["app"]
      })
      expect(Screenshot.getConfig().capture).to.eql(["app"])

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

      it "throws if capture is not an array", ->
        expect =>
          Screenshot.defaults({ capture: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'capture' option must be an array with one or both of the following items: 'app', 'runner'. You passed: foo")

      it "throws if capture is an empty array", ->
        expect =>
          Screenshot.defaults({ capture: [] })
        .to.throw("Cypress.Screenshot.defaults() 'capture' option must be an array with one or both of the following items: 'app', 'runner'. You passed: ")

      it "throws if capture is an array with invalid items", ->
        expect =>
          Screenshot.defaults({ capture: ["ap"] })
        .to.throw("Cypress.Screenshot.defaults() 'capture' option must be an array with one or both of the following items: 'app', 'runner'. You passed: ap")

      it "throws if capture is an array with duplicates", ->
        expect =>
          Screenshot.defaults({ capture: ["app", "app"] })
        .to.throw("Cypress.Screenshot.defaults() 'capture' option must be an array with one or both of the following items: 'app', 'runner'. You passed: app, app")

      it "throws if capture is an array with too many items", ->
        expect =>
          Screenshot.defaults({ capture: ["runner", "app", "app"] })
        .to.throw("Cypress.Screenshot.defaults() 'capture' option must be an array with one or both of the following items: 'app', 'runner'. You passed: runner, app, app")

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

      it "throws if beforeScreenshot is not a function", ->
        expect =>
          Screenshot.defaults({ beforeScreenshot: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'beforeScreenshot' option must be a function. You passed: foo")

      it "throws if afterScreenshot is not a function", ->
        expect =>
          Screenshot.defaults({ afterScreenshot: "foo" })
        .to.throw("Cypress.Screenshot.defaults() 'afterScreenshot' option must be a function. You passed: foo")

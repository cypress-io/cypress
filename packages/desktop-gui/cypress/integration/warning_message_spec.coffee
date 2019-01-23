describe "WarningMessage", ->
  beforeEach ->
    cy.fixture("specs").as("specs")
    @warningObj = {type: "NOT_GOOD_BUT_NOT_TOO_BAD", name: "Fairly serious warning", message: "Some warning\nmessage"}

    cy.visitIndex().then (win) =>
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({projectRoot: "/foo/bar"})
      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "openProject").resolves(@config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "closeProject").resolves()
      cy.stub(@ipc, "onConfigChanged")
      cy.stub(@ipc, "onProjectWarning")
      cy.stub(@ipc, "externalOpen")

      @start()

  it "shows warning", ->
    cy.shouldBeOnProjectSpecs().then =>
      @ipc.onProjectWarning.yield(null, @warningObj)

    cy.get(".alert-warning")
      .should("be.visible")
      .should("contain", "Some warning")

  it "can dismiss the warning", ->
    cy.shouldBeOnProjectSpecs().then =>
      @ipc.onProjectWarning.yield(null, @warningObj)

    cy.get(".alert-warning button").click()
    cy.get(".alert-warning").should("not.exist")

  it "stays dismissed after receiving same warning again", ->
    cy.shouldBeOnProjectSpecs().then =>
      @ipc.onProjectWarning.yield(null, @warningObj)

    cy.get(".alert-warning button").click()
    cy.get(".alert-warning").should("not.exist").then =>
      @ipc.onProjectWarning.yield(null, @warningObj)
    cy.get(".alert-warning").should("not.exist")

  it "shows new, different warning after dismissing old warning", ->
    cy.shouldBeOnProjectSpecs().then =>
      @ipc.onProjectWarning.yield(null, @warningObj)

    cy.get(".alert-warning button").click()
    cy.get(".alert-warning").should("not.exist").then =>
      @ipc.onProjectWarning.yield(null, {type: "PRETTY_BAD_WARNING", name: "Totally serious warning", message: "Some warning\nmessage"})
    cy.get(".alert-warning").should("be.visible")

  it "renders markdown", ->
    markdownWarningObj = {type: "NOT_GOOD_BUT_NOT_TOO_BAD", name: "Fairly serious warning", message: "Some warning\n**message**"}
    cy.shouldBeOnProjectSpecs().then =>
      @ipc.onProjectWarning.yield(null, markdownWarningObj)

    cy.get(".alert-warning")
      .should("not.contain", "**message**")
      .should("contain", "message")

  it "opens links outside of electron", ->
    linkWarningObj = {type: "NOT_GOOD_BUT_NOT_TOO_BAD", name: "Fairly serious warning", message: "Some warning:\nhttp://example.com"}
    cy.shouldBeOnProjectSpecs().then =>
      @ipc.onProjectWarning.yield(null, linkWarningObj)

    cy
      .contains(".alert-warning a", "http://example.com")
      .click()
      .then ->
        expect(@ipc.externalOpen).to.be.calledWith("http://example.com/")

  it "doesn't try to open non-links", ->
    nonlinkWarningObj = {type: "NOT_GOOD_BUT_NOT_TOO_BAD", name: "Fairly serious warning", message: "Some warning:\n<strong>not here</strong>"}
    cy.shouldBeOnProjectSpecs().then =>
      @ipc.onProjectWarning.yield(null, nonlinkWarningObj)

    cy
      .contains(".alert-warning strong", "not here")
      .click()
      .then ->
        expect(@ipc.externalOpen).not.to.be.called

describe "Async Integration Tests", ->
  before ->
    Cypress.start()

  beforeEach ->
    loadFixture("html/async").done (iframe) =>
      Cypress.set(@currentTest)
      Cypress.setup(runner, $(iframe), ->)
      @r = Cypress.getRunner().override()

  afterEach ->
    Cypress.abort()

  after ->
    Cypress.stop().then => @r.restore()

  it "will find 'form success' message by default (after retrying)", ->
    cy
      .server()
      .route("POST", "/users", {})
      .get("input[name=name]").type("brian")
      .get("#submit").click()
      .get("form span").then ($span) ->
        expect($span).to.contain("form success!")

  it "fails without an explicit wait when an element is immediately found", (done) ->
    @allowErrors()

    cy.on "fail", (err) ->
      done()

    cy
      .server()
      .route("POST", "/users", {})
      .get("input[name=name]").type("brian")
      .get("#submit").click()
      .get("form").then ($form) ->
        expect($form).to.contain("form success!")

  it "needs an explicit wait when an element is immediately found", ->
    cy
      .server()
      .route("POST", "/users", {})
      .get("input[name=name]").type("brian")
      .get("#submit").click()
      .get("form").wait ($form) ->
        expect($form).to.contain("form success!")
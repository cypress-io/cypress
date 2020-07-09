describe "fetch works", ->
  it "sets polyfilled state", ->
    cy.visit("http://localhost:1818/first")
      .then ->
        expect(cy.state("fetchPolyfilled")).to.be.true

  it "spies on fetch requests", ->
    cy.server()
    cy.route("/get-json").as("get-json")
    cy.visit("http://localhost:1818/first")
    cy.wait("@get-json")

  it "spies on fetch requests from second page", ->
    cy.server()
    cy.route("/get-text").as("get-text")
    cy.visit("http://localhost:1818/first")
    cy.contains("a", "second").click()
    cy.wait("@get-text")
    # confirm the real response from the server is shown
    cy.contains("text: pong").should("be.visible")

  it "stubs GET fetch text", ->
    cy.server()
    cy.route("/get-text", "mock pong")
    cy.visit("http://localhost:1818/second")
    # confirm the stub response is shown
    cy.contains("text: mock pong").should("be.visible")

  it "spies on fetch POST", ->
    cy.server()
    cy.route("POST", "/add").as("add")
    cy.visit("http://localhost:1818/addition")
    cy.wait("@add")
    # confirm the response from the server is displayed
    cy.contains("answer: 17").should('be.visible')

  it "stubs fetch POST", ->
    cy.server()
    cy.route("POST", "/add", {answer: 193}).as("add")
    cy.visit("http://localhost:1818/addition")
    cy.wait("@add")
    # confirm the stub was used
    cy.contains("answer: 193").should('be.visible')


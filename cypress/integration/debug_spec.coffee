describe "Debug Console", ->
  beforeEach ->
    cy
      .viewport(800, 400)
      .visit("/debug")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()
        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  it "has debug console title", ->
    cy.title().should("include", "Debug Console")

  it "triggers get:logs", ->
    expect(@App.ipc).to.be.calledWith("get:logs")

  it "triggers on:log", ->
    expect(@App.ipc).to.be.calledWith("on:log")

  context "no logs", ->
    beforeEach ->
      @ipc.handle("get:logs", null, [])

    it "displays empty logs", ->
      cy.get(".empty").should("contain", "Can't find any logs")

  context "logs list", ->
    beforeEach ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)

    it "lists all logs", ->
      cy
        .get("#code").find("tbody>tr")
          .should("have.length", @logs?.length)

    describe "log detail", ->
      beforeEach ->
        cy.get("#code").find("tbody>tr").first().as("log")

      it "lists most recent log first", ->
        cy
          .get("@log").find("td")
            .contains(@logs[0].message)

      it "displays type of log", ->
        cy.get("@log").should("contain", @logs[0].type)

      it "displays data of log", ->
        cy.get("@log").should("contain", "{\"foo\":\"bar\"}")

      it "displays timestamp", ->
        cy
          .get("@log").find("td").first()
            .should("not.be.empty")
            .and("contain", "ago")

  context "err on log list", ->
    beforeEach ->
      @ipc.handle("get:logs", "something bad happened", null)

    it "handles err gracefully", ->
      cy.get("table").find(".empty")

  context "on new log", ->
    beforeEach ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .fixture("log").then (@log) ->
          @ipc.handle("on:log", null, @log)

    it "adds new log to table", ->
      cy
        .get("#code").find("tbody>tr").first()
          .should("contain", @log.message)

  context "clear log", ->
    it "triggers clear:logs on click", ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .contains(".btn", "Clear").click().then ->
          expect(@App.ipc).to.be.calledWith("clear:logs")

    it "clears log on click", ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .get("#code").find(".empty").should("not.exist")
        .contains(".btn", "Clear").click().then ->
          @ipc.handle("clear:logs")
        .get("#code").find(".empty").should("be.visible")

  context "refresh log", ->
    it "triggers get:logs again on click", ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .contains(".btn", "Refresh").click().then ->
          expect(@App.ipc).to.be.calledWith("get:logs")

    it "renders new logs on refresh", ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .contains(".btn", "Refresh").click()
        .fixture("log").then (@log) ->
          @ipc.handle("get:logs", null, [@log])
        .get("#code").should("contain", "there was an info")




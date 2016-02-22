describe "Debug Console [01o]", ->
  beforeEach ->
    cy
      .viewport(800, 400)
      .visit("/debug")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()
        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  it "has debug console title [01g]", ->
    cy.title().should("include", "Debug Console")

  it "triggers get:logs [01p]", ->
    expect(@App.ipc).to.be.calledWith("get:logs")

  it "triggers on:log [01q]", ->
    expect(@App.ipc).to.be.calledWith("on:log")

  context "no logs [01t]", ->
    beforeEach ->
      @ipc.handle("get:logs", null, [])

    it "displays empty logs [01u]", ->
      cy.get(".empty").should("contain", "No Logs Found.")

  context "logs list [01r]", ->
    beforeEach ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)

    it "lists all logs [01s]", ->
      cy
        .get("#code").find("tbody>tr")
          .should("have.length", @logs?.length)

    describe "log detail [01w]", ->
      beforeEach ->
        cy.get("#code").find("tbody>tr").first().as("log")

      it "lists most recent log first [01v]", ->
        cy
          .get("@log").find("td")
            .contains(@logs[0].message)

      it "displays type of log [01x]", ->
        cy.get("@log").should("contain", @logs[0].type)

      it "displays data of log [01x]", ->
        cy.get("@log").should("contain", "{\"foo\":\"bar\"}")

      it "displays timestamp [01y]", ->
        cy
          .get("@log").find("td").first()
            .should("not.be.empty")
            .and("contain", "ago")

  context "err on log list [01z]", ->
    beforeEach ->
      @ipc.handle("get:logs", "something bad happened", null)

    it "handles err gracefully [020]", ->
      cy.get("table").find(".empty")

  context "on new log [021]", ->
    beforeEach ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .fixture("log").then (@log) ->
          @ipc.handle("on:log", null, @log)

    it "adds new log to table [022]", ->
      cy
        .get("#code").find("tbody>tr").first()
          .should("contain", @log.message)

  context "clear log [023]", ->
    it "triggers clear:logs on click [025]", ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .contains(".btn", "Clear").click().then ->
          expect(@App.ipc).to.be.calledWith("clear:logs")

    it "clears log on click [024]", ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .get("#code").find(".empty").should("not.exist")
        .contains(".btn", "Clear").click().then ->
          @ipc.handle("clear:logs")
        .get("#code").find(".empty").should("be.visible")

  context "refresh log [026]", ->
    it "triggers get:logs again on click [025]", ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .contains(".btn", "Refresh").click().then ->
          expect(@App.ipc).to.be.calledWith("get:logs")

    it "renders new logs on refresh [027]", ->
      cy
        .fixture("logs").then (@logs) ->
          @ipc.handle("get:logs", null, @logs)
        .contains(".btn", "Refresh").click()
        .fixture("log").then (@log) ->
          @ipc.handle("get:logs", null, [@log])
        .get("#code").should("contain", "there was an info")




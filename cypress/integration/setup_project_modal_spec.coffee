_ = require("lodash")
moment = require("moment")

describe "Setup Project", ->
  beforeEach ->
    @firstProjectName = "My-Fake-Project"

    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win
        @agents = cy.agents()
        @ipc.handle("get:options", null, {})
        @agents.spy(@App, "ipc")
      .fixture("builds").as("builds")
      .fixture("browsers").as("browsers")
      .fixture("user").then (@user) ->
        @ipc.handle("get:current:user", null, @user)
      .fixture("projects").then (@projects) ->
        @ipc.handle("get:projects", null, @projects)
      .fixture("projects_statuses").then (@projects_statuses) =>
        @ipc.handle("get:project:statuses", null, @projects_statuses)
      .get(".projects-list a")
        .contains("My-Fake-Project").click()
      .fixture("ci_keys").as("ciKeys")
      .fixture("config").then (@config) ->
        @config.projectId = null
        @ipc.handle("open:project", null, @config)
      .fixture("specs").as("specs").then ->
        @ipc.handle("get:specs", null, @specs)
      .get(".nav a").contains("Builds").click()
      .then =>
        @ipc.handle("get:builds", null, [])

  it "displays empty message", ->
    cy.contains("You Have No Recorded Builds")

  context "modal display", ->
    beforeEach ->
      cy
        .fixture("organizations").as("orgs").then ->
          @ipc.handle("get:orgs", null, @orgs)
        .get(".btn").contains("Setup Project").click()

    it "clicking link opens setup project window", ->
      cy
        .get(".modal").should("be.visible")

    it "submit button is disabled", ->
      cy
        .get(".modal").contains(".btn", "Setup Project")
          .should("be.disabled")

  context "project name", ->
    beforeEach ->
      cy
        .fixture("organizations").as("orgs").then ->
          @ipc.handle("get:orgs", null, @orgs)
        .get(".btn").contains("Setup Project").click()

    it "prefills and autofocuses Project Name", ->
      cy
        .focused().should("have.value", @firstProjectName)

    it "allows me to change Project Name value", ->
      @newProjectName = "New Project Here"

      cy
        .get("#projectName").clear().type(@newProjectName)
        .get("#projectName").should("have.value", @newProjectName)

  context "selecting owner", ->
    describe "default", ->
      beforeEach ->
        cy
          .fixture("organizations").as("orgs").then ->
            @ipc.handle("get:orgs", null, @orgs)
          .get(".btn").contains("Setup Project").click()

      it "has no owner selected by default", ->
        cy.get("#me").should("not.be.selected")
        cy.get("#org").should("not.be.selected")

    describe "select me", ->
      beforeEach ->
        cy
          .fixture("organizations").as("orgs").then ->
            @ipc.handle("get:orgs", null, @orgs)
          .get(".btn").contains("Setup Project").click()
          .get(".privacy-radio").should("not.be.visible")
          .get(".modal-content")
            .contains(".btn", "Me").click()

      it "displays public & private radios with no preselects", ->
        cy
          .get(".privacy-radio").should("be.visible")
            .find("input").should("not.be.checked")

    describe "select organization", ->
      context "with organization", ->
        beforeEach ->
          cy
            .fixture("organizations").as("orgs").then ->
              @ipc.handle("get:orgs", null, @orgs)
            .get(".btn").contains("Setup Project").click()
            .get(".modal-content")
              .contains(".btn", "An Organization").click()

        it "lists organizations to assign to project", ->
          cy
            .get("#organizations-select").find("option")
              # orgs minus the default + 1 for the 'select'
              .should("have.length", (@orgs.length) - 1 + 1)

        it "selects none by default", ->
          cy
            .get("#organizations-select").should("have.value", "-- Select Organization --")

        it "opens external link on click of manage", ->
          cy
            .get(".manage-orgs-btn").click().then ->
               expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/organizations")

        it "displays public & private radios on select", ->
          cy
            .get(".privacy-radio").should("not.be.visible")
            .get("select").select("Acme Developers")
            .get(".privacy-radio").should("be.visible")
              .find("input").should("not.be.checked")

        it "clears selections when switching back to Me", ->
          cy
            .get("select").select("Acme Developers")
            .get(".privacy-radio")
              .find("input").first().check()
            .get(".btn").contains("Me").click()
            .get(".privacy-radio").find("input").should("not.be.checked")
            .get(".btn").contains("An Organization").click()
            .get("#organizations-select").should("have.value", "-- Select Organization --")

      context "with no organizations", ->
        beforeEach ->
          cy
            .fixture("organizations").as("orgs").then ->
              @ipc.handle("get:orgs", null, [])
            .get(".btn").contains("Setup Project").click()
            .get(".modal-content")
              .contains(".btn", "An Organization").click()

        it "displays empty message", ->
          cy
            .get(".empty-select-orgs").should("be.visible")
            .contains("Create Organization").click().then ->
               expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/organizations")

      context "polls for newly added organizations", ->
        beforeEach ->
          cy
            .window().then (win) =>
              @clock = win.sinon.useFakeTimers()

            .fixture("organizations").as("orgs").then =>
              @ipc.handle("get:orgs", null, @orgs)
              @clock.tick(100)
            .get(".btn").contains("Setup Project").click()
            .get(".modal-content")
              .contains(".btn", "An Organization").click()

        afterEach ->
          @clock.restore()

        it "polls for orgs twice on click of org", ->
          cy.then =>
            @ipc.handle("get:orgs", null, @orgs)
            @clock.tick(11000)
          .then =>
              expect(@App.ipc.withArgs("get:orgs")).to.be.calledTwice

        it "updates orgs list on successful poll", ->
          cy.then =>
            @orgs[0].name = "Foo Bar Devs"
            @ipc.handle("get:orgs", null, @orgs)
            @clock.tick(11000)
          cy
            .get("#organizations-select").find("option")
              .contains("Foo Bar Devs")

  describe "on submit", ->
    beforeEach ->
      cy
        .fixture("organizations").as("orgs").then ->
          @ipc.handle("get:orgs", null, @orgs)
        .contains(".btn", "Setup Project").click()
        .get(".modal-body")
          .contains(".btn", "Me").click()
        .get(".privacy-radio").find("input").last().check()
        .get(".modal-body")
          .contains(".btn", "Setup Project").click()

    it "disables button", ->
      cy
        .get(".modal-body")
        .contains(".btn", "Setup Project")
        .should("be.disabled")

    it "shows spinner", ->
      cy
        .get(".modal-body")
        .contains(".btn", "Setup Project")
        .find("i")
        .should("be.visible")

  describe "successfully submit form", ->
    beforeEach ->
      @ipc.handle("setup:ci:project", null, {
        id: "project-id-123"
        public: true
        orgId: "000"
      })
      @ipc.handle("get:ci:keys", null, @ciKeys)

      cy
        .fixture("organizations").as("orgs").then ->
          @ipc.handle("get:orgs", null, @orgs)
        .contains(".btn", "Setup Project").click()

    context "org/public", ->
      beforeEach ->
        cy
          .get(".modal-body")
            .contains(".btn", "An Organization").click()
          .get("select").select("Acme Developers")
          .get(".privacy-radio").find("input").first().check()
          .get(".modal-body")
            .contains(".btn", "Setup Project").click()

      it "sends data from form to ipc event", ->
        expect(@App.ipc).to.be.calledWith("setup:ci:project", {
          projectName: "My-Fake-Project"
          orgId: "777"
          public: true
        })

    context "me/private", ->
      beforeEach ->
        cy
          .get(".modal-body")
            .contains(".btn", "Me").click()
          .get(".privacy-radio").find("input").last().check()
          .get(".modal-body")
            .contains(".btn", "Setup Project").click()

      it "sends data from form to ipc event", ->
        expect(@App.ipc).to.be.calledWith("setup:ci:project", {
          projectName: "My-Fake-Project"
          orgId: "000"
          public: false
        })

    context "me/public", ->
      beforeEach ->
        cy
          .get(".modal-body")
            .contains(".btn", "Me").click()
          .get(".privacy-radio").find("input").first().check()
          .get(".modal-body")
            .contains(".btn", "Setup Project").click()

      it "sends data from form to ipc event", ->
        expect(@App.ipc).to.be.calledWith("setup:ci:project", {
          projectName: "My-Fake-Project"
          orgId: "000"
          public: true
        })

      it "closes modal", ->
        cy.get(".modal").should("not.be.visible")

      it "updates localStorage projects cache", ->
        expect(JSON.parse(localStorage.projects || "[]")[0].orgName).to.equal("Jane Lane")

      it "displays empty builds page", ->
        cy.contains("To record your first")

      describe "welcome page", ->
        it "displays command to run with the ci key", ->
          cy.contains("cypress ci ci-key-123")

  describe "errors from ipc event", ->
    beforeEach ->
      cy
        .fixture("organizations").as("orgs").then ->
          @ipc.handle("get:orgs", null, @orgs)
        .contains(".btn", "Setup Project").click()
        .get(".modal-body")
          .contains(".btn", "Me").click()
        .get(".privacy-radio").find("input").last().check()
        .get(".modal-body")
          .contains(".btn", "Setup Project").click()
        .then =>
          @ipc.handle("setup:ci:project", {
            name: "Fatal Error!"
            message: """
            {
              "system": "down",
              "toxicity": "of the city"
            }
            """
          })

    it "displays error name and message", ->
      cy.contains('"system": "down"')


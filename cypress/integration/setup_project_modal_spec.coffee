_ = require("lodash")
moment = require("moment")
{deferred, stubIpc} = require("../support/util")

describe "Setup Project", ->
  beforeEach ->
    cy
      .fixture("user").as("user")
      .fixture("projects").as("projects")
      .fixture("projects_statuses").as("projectStatuses")
      .fixture("config").as("config")
      .fixture("specs").as("specs")
      .fixture("organizations").as("orgs")
      .fixture("keys").as("keys")
      .visit("/")
      .window().then (win) ->
        {@App} = win
        cy.stub(@App, "ipc").as("ipc")

        @config.projectId = null
        @setupCiProject = deferred()
        @getOrgs = deferred()

        stubIpc(@App.ipc, {
          "on:menu:clicked": ->
          "close:browser": ->
          "close:project": ->
          "on:focus:tests": ->
          "get:options": (stub) => stub.resolves({})
          "get:current:user": (stub) => stub.resolves(@user)
          "updater:check": (stub) => stub.resolves(false)
          "get:projects": (stub) => stub.resolves(@projects)
          "get:project:statuses": (stub) => stub.resolves(@projectStatuses)
          "open:project": (stub) => stub.yields(null, @config)
          "get:specs": (stub) => stub.resolves(@specs)
          "get:builds": (stub) => stub.resolves([])
          "get:orgs": (stub) => stub.returns(@getOrgs.promise)
          "setup:dashboard:project": (stub) => stub.returns(@setupCiProject.promise)
          "get:record:keys": (stub) => stub.resolves(@keys)
        })

        @App.start()

        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").click()
          .get(".navbar-default a")
            .contains("Runs").click()

  it "displays empty message", ->
    cy.contains("You Have No Recorded Runs")

  context "modal display", ->
    beforeEach ->
      @getOrgs.resolve(@orgs)
      cy
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
      @getOrgs.resolve(@orgs)
      cy
        .get(".btn").contains("Setup Project").click()

    it "prefills Project Name", ->
      cy
        .get("#projectName").should("have.value", "My-Fake-Project")

    it "allows me to change Project Name value", ->
      newProjectName = "New Project Here"

      cy
        .get("#projectName").clear().type(newProjectName)
        .get("#projectName").should("have.value", newProjectName)

  context "selecting owner", ->
    describe "default", ->
      beforeEach ->
        @getOrgs.resolve(@orgs)
        cy
          .get(".btn").contains("Setup Project").click()

      it "has no owner selected by default", ->
        cy.get("#me").should("not.be.selected")
        cy.get("#org").should("not.be.selected")

      it "org docs are linked", ->
        cy
          .contains("label", "Who should own this")
            .find("a").click().then ->
              expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/what-are-organizations")


    describe "select me", ->
      beforeEach ->
        @getOrgs.resolve(@orgs)
        cy
          .get(".btn").contains("Setup Project").click()
          .get(".privacy-radio").should("not.be.visible")
          .get(".modal-content")
            .contains(".btn", "Me").click()

      it "access docs are linked", ->
        cy
          .contains("label", "Who should see the runs")
            .find("a").click().then ->
              expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/what-is-project-access")

      it "displays public & private radios with no preselects", ->
        cy
          .get(".privacy-radio").should("be.visible")
            .find("input").should("not.be.checked")

    describe "select organization", ->
      context "with organization", ->
        beforeEach ->
          @getOrgs.resolve(@orgs)
          cy
            .get(".btn").contains("Setup Project").click()
            .get(".modal-content")
              .contains(".btn", "An Organization").click()

        it "lists organizations to assign to project", ->
          cy
            .get("#organizations-select").find("option")
              .should("have.length", @orgs.length)

        it "selects none by default", ->
          cy
            .get("#organizations-select").should("have.value", "")

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
            .get("#organizations-select").should("have.value", "")

      context "with no organizations", ->
        beforeEach ->
          @getOrgs.resolve([])
          cy
            .get(".btn").contains("Setup Project").click()
            .get(".modal-content")
              .contains(".btn", "An Organization").click()

        it "displays empty message", ->
          cy
            .get(".empty-select-orgs").should("be.visible")

        it "opens dashboard organizations when 'create organizatoin' is clicked", ->
          cy.contains("Create Organization").click().then ->
             expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/organizations")

      context "polls for newly added organizations", ->
        beforeEach ->
          @getOrgs.resolve(@orgs)
          cy
            .clock()
            .get(".btn").contains("Setup Project").click()
            .get(".modal-content")
              .contains(".btn", "An Organization").click()

        it "polls for orgs twice on click of org", ->
          cy.tick(11000).then =>
            expect(@App.ipc.withArgs("get:orgs")).to.be.calledTwice

        it "updates orgs list on successful poll", ->
          @orgs[0].name = "Foo Bar Devs"
          @getOrgsAgain = @App.ipc.withArgs("get:orgs").onCall(2).resolves(@orgs)
          cy
            .tick(11000)
            .get("#organizations-select").find("option")
              .contains("Foo Bar Devs")

  describe "on submit", ->
    beforeEach ->
      @getOrgs.resolve(@orgs)
      cy
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
      @getOrgs.resolve(@orgs)
      @setupCiProject.resolve({
        id: "project-id-123"
        public: true
        orgId: "000"
      })

      cy.contains(".btn", "Setup Project").click()

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
        expect(@App.ipc).to.be.calledWith("setup:dashboard:project", {
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
        expect(@App.ipc).to.be.calledWith("setup:dashboard:project", {
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
        expect(@App.ipc).to.be.calledWith("setup:dashboard:project", {
          projectName: "My-Fake-Project"
          orgId: "000"
          public: true
        })

      it "closes modal", ->
        cy.get(".modal").should("not.be.visible")

      it "updates localStorage projects cache", ->
        expect(JSON.parse(localStorage.projects || "[]")[0].orgName).to.equal("Jane Lane")

      it "displays empty runs page", ->
        cy.contains("To record your first")

      describe "welcome page", ->
        it "displays command to run with the record key", ->
          cy.contains("cypress run --record --key record-key-123")

  describe "errors from ipc event", ->
    beforeEach ->
      @getOrgs.resolve(@orgs)
      cy
        .contains(".btn", "Setup Project").click()
        .get(".modal-body")
          .contains(".btn", "Me").click()
        .get(".privacy-radio").find("input").last().check()
        .get(".modal-body")
          .contains(".btn", "Setup Project").click()
        .then =>
          @setupCiProject.reject({
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

describe "Set Up Project", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("projects").as("projects")
    cy.fixture("projects_statuses").as("projectStatuses")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")
    cy.fixture("organizations").as("orgs")
    cy.fixture("keys").as("keys")
    cy.fixture("usage").as("usage")

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({projectPath: "/foo/bar"})
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "closeBrowser").resolves(null)
      @config.projectId = null
      cy.stub(@ipc, "openProject").resolves(@config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "getRuns").resolves([])
      cy.stub(@ipc, "getRecordKeys").resolves(@keys)
      cy.stub(@ipc, "pingApiServer").resolves()
      cy.stub(@ipc, "externalOpen")

      @getCurrentUser = @util.deferred()
      cy.stub(@ipc, "getCurrentUser").resolves(@getCurrentUser.promise)

      @getOrgs = @util.deferred()
      cy.stub(@ipc, "getOrgs").returns(@getOrgs.promise)

      @getProjectStatus = @util.deferred()
      cy.stub(@ipc, "getProjectStatus").returns(@getProjectStatus.promise)

      @setupDashboardProject = @util.deferred()
      cy.stub(@ipc, "setupDashboardProject").returns(@setupDashboardProject.promise)

      start()

      cy
        .get(".navbar-default a")
          .contains("Runs").click()

  it "displays 'need to set up' message", ->
    cy.contains("You Have No Recorded Runs")

  describe "when there is a current user", ->
    beforeEach ->
      @getCurrentUser.resolve(@user)

    describe "general behavior", ->
      beforeEach ->
        @getOrgs.resolve(@orgs)
        cy.get(".btn").contains("Set Up Project").click()

      it "clicking link opens setup project window", ->
        cy.get(".modal").should("be.visible")

      it "submit button is disabled", ->
        cy
          .get(".modal").contains(".btn", "Set Up Project")
            .should("be.disabled")

      it "prefills Project Name", ->
        cy.get("#projectName").should("have.value", "bar")

      it "allows me to change Project Name value", ->
        cy
          .get("#projectName").clear().type("New Project Here")
            .should("have.value", "New Project Here")

      describe "default owner", ->
        it "has no owner selected by default", ->
          cy.get("#me").should("not.be.selected")
          cy.get("#org").should("not.be.selected")

        it "org docs are linked", ->
          cy
            .contains("label", "Who should own this")
              .find("a").click().then ->
                expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/what-are-organizations")

      describe "selecting me as owner", ->
        beforeEach ->
          cy
            .get(".privacy-radio").should("not.be.visible")
            .get(".modal-content")
              .contains(".btn", "Me").click()

        it "access docs are linked", ->
          cy
            .contains("label", "Who should see the runs")
              .find("a").click().then ->
                expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/what-is-project-access")

        it "displays public & private radios with no preselects", ->
          cy
            .get(".privacy-radio").should("be.visible")
              .find("input").should("not.be.checked")

    describe "selecting an org", ->
      context "with orgs", ->
        beforeEach ->
          @getOrgs.resolve(@orgs)
          cy.get(".btn").contains("Set Up Project").click()
          cy.get(".modal-content")
            .contains(".btn", "An Organization").click()

        it "lists organizations to assign to project", ->
          cy.get("#organizations-select").find("option")
            .should("have.length", @orgs.length)

        it "selects none by default", ->
          cy.get("#organizations-select").should("have.value", "")

        it "opens external link on click of manage", ->
          cy.get(".manage-orgs-btn").click().then ->
             expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/organizations")

        describe "select org w/in projects limit", ->
          beforeEach ->
            cy.stub(@ipc, "getUsage").resolves(@usage)
            cy.get(".privacy-radio").should("not.be.visible")
            cy.get("select").select("Acme Developers")

          it "displays public/private radios as enabled", ->
            cy.get(".privacy-radio").should("be.visible")
              .find("input")
                .should("not.be.checked")
                .and("not.be.disabled")

          it "does not display msg about private projects", ->
            cy.get(".privacy-radio")
              .contains("upgrade your account")
                .should("not.be.visible")

          it "clears selections when switching back to Me", ->
            cy.get(".privacy-radio")
                .find("input").first().check()
            cy.get(".btn").contains("Me").click()
            cy.get(".privacy-radio").find("input").should("not.be.checked")
            cy.get(".btn").contains("An Organization").click()
            cy.get("#organizations-select").should("have.value", "")

        describe "select org w/ reached projects limit", ->
          beforeEach ->
            @usage.used.privateProjects = 2
            cy.stub(@ipc, "getUsage").resolves(@usage)
            cy.get(".privacy-radio").should("not.be.visible")
            cy.get("select").select("Osato Devs")

          it "displays private radio as disabled", ->
            cy.get(".privacy-radio").should("be.visible")
              .find("input")
                .should("not.be.checked")
                .and("be.disabled")

          it "displays msg w/ link about private projects", ->
            cy.get(".privacy-radio")
              .contains("upgrade your account")
              .click().then ->
                 expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/organizations/999/billing")

      context "without orgs", ->
        beforeEach ->
          @getOrgs.resolve([])
          cy.get(".btn").contains("Set Up Project").click()
          cy.get(".modal-content")
            .contains(".btn", "An Organization").click()

        it "displays empty message", ->
          cy.get(".empty-select-orgs").should("be.visible")

        it "opens dashboard organizations when 'create organization' is clicked", ->
          cy.contains("Create Organization").click().then ->
             expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/organizations")

      context "without only default org", ->
        beforeEach ->
          @getOrgs.resolve([{
            "id": "000",
            "name": "Jane Lane",
            "default": true
          }])
          cy.get(".btn").contains("Set Up Project").click()
          cy.get(".modal-content")
            .contains(".btn", "An Organization").click()

        it "displays empty message", ->
          cy.get(".empty-select-orgs").should("be.visible")

        it "opens dashboard organizations when 'create organization' is clicked", ->
          cy.contains("Create Organization").click().then ->
             expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/organizations")


      context "polls for newly added organizations", ->
        beforeEach ->
          @getOrgs.resolve(@orgs)
          cy
            .clock()
            .get(".btn").contains("Set Up Project").click()
            .get(".modal-content")
              .contains(".btn", "An Organization").click()

        it "polls for orgs twice on click of org", ->
          cy.tick(11000).then =>
            expect(@ipc.getOrgs).to.be.calledTwice

        it "updates orgs list on successful poll", ->
          @orgs[0].name = "Foo Bar Devs"
          @getOrgsAgain = @ipc.getOrgs.onCall(2).resolves(@orgs)

          cy
            .tick(11000)
            .get("#organizations-select").find("option")
              .contains("Foo Bar Devs")

    describe "on submit", ->
      beforeEach ->
        @getOrgs.resolve(@orgs)
        cy
          .contains(".btn", "Set Up Project").click()
          .get(".modal-body")
            .contains(".btn", "Me").click()
          .get(".privacy-radio").find("input").last().check()
          .get(".modal-body")
            .contains(".btn", "Set Up Project").click()

      it "disables button", ->
        cy
          .get(".modal-body")
          .contains(".btn", "Set Up Project")
          .should("be.disabled")

      it "shows spinner", ->
        cy
          .get(".modal-body")
          .contains(".btn", "Set Up Project")
          .find("i")
          .should("be.visible")

    describe "successfully submit form", ->
      beforeEach ->
        @getOrgs.resolve(@orgs)
        @setupDashboardProject.resolve({
          id: "project-id-123"
          public: true
          orgId: "000"
        })

        cy.contains(".btn", "Set Up Project").click()

      it "sends project name, org id, and public flag to ipc event", ->
        cy
          .get(".modal-body")
            .contains(".btn", "An Organization").click()
          .get("#projectName").clear().type("New Project")
          .get("select").select("Acme Developers")
          .get(".privacy-radio").find("input").first().check()
          .get(".modal-body")
            .contains(".btn", "Set Up Project").click()
          .then =>
            expect(@ipc.setupDashboardProject).to.be.calledWith({
              projectName: "New Project"
              orgId: "777"
              public: true
            })

      context "org/public", ->
        beforeEach ->
          cy
            .get(".modal-body")
              .contains(".btn", "An Organization").click()
            .get("select").select("Acme Developers")
            .get(".privacy-radio").find("input").first().check()
            .get(".modal-body")
              .contains(".btn", "Set Up Project").click()

        it "sends data from form to ipc event", ->
          expect(@ipc.setupDashboardProject).to.be.calledWith({
            projectName: "bar"
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
              .contains(".btn", "Set Up Project").click()

        it "sends data from form to ipc event", ->
          expect(@ipc.setupDashboardProject).to.be.calledWith({
            projectName: "bar"
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
              .contains(".btn", "Set Up Project").click()

        it "sends data from form to ipc event", ->
          expect(@ipc.setupDashboardProject).to.be.calledWith({
            projectName: "bar"
            orgId: "000"
            public: true
          })

        it "closes modal", ->
          cy.get(".modal").should("not.be.visible")

        it "updates localStorage projects cache", ->
          expect(JSON.parse(localStorage.projects || "[]")[0].orgName).to.equal("Jane Lane")

        it "displays empty runs page", ->
          cy.contains("To record your first")

        it "displays command to run with the record key", ->
          cy.contains("cypress run --record --key record-key-123")

    describe "errors", ->
      beforeEach ->
        @getOrgs.resolve(@orgs)
        cy
          .contains(".btn", "Set Up Project").click()
          .get(".modal-body")
            .contains(".btn", "Me").click()
          .get(".privacy-radio").find("input").last().check()
          .get(".modal-body")
            .contains(".btn", "Set Up Project").click()

      it "logs user out when 401", ->
        @setupDashboardProject.reject({ name: "", message: "", statusCode: 401 })
        cy.shouldBeLoggedOut()

      it "displays error name and message when unexpected", ->
        @setupDashboardProject.reject({
          name: "Fatal Error!"
          message: """
          {
            "system": "down",
            "toxicity": "of the city"
          }
          """
        })
        cy.contains('"system": "down"')

    describe "when get orgs 401s", ->
      beforeEach ->
        cy
          .contains(".btn", "Set Up Project").click()
          .then =>
            @getOrgs.reject({ name: "", message: "", statusCode: 401 })

      it "logs user out", ->
        cy.shouldBeLoggedOut()

  describe "when there is no current user", ->
    beforeEach ->
      @getCurrentUser.resolve(null)
      cy.get(".btn").contains("Set Up Project").click()

    it "shows login", ->
      cy.get(".modal").contains("Log In with GitHub")

    describe "when login succeeds", ->
      beforeEach ->
        cy.stub(@ipc, "windowOpen").resolves()
        cy.stub(@ipc, "logIn").resolves(@user)
        cy.contains("button", "Log In with GitHub").click()

      it "shows setup", ->
        cy.contains("h4", "Set Up Project")

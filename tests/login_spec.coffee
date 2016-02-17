describe "Login [000]", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @ipc.handle("get:options", null, {})

  context "without a current user [02s]", ->
    beforeEach ->
      @ipc.handle("get:current:user", null, {})

    it "displays 'Cypress.io' [02t]", ->
      cy.get("#login").contains("Cypress.io")

    it "has Github Login button [02u]", ->
      cy.get("#login").contains("button", "Login with GitHub")

    describe "click 'Login with GitHub' [005]", ->
      beforeEach ->
        cy.get("#login").contains("button", "Login with GitHub").as("loginBtn")

      it "triggers ipc 'window:open' on click [002]", ->
        @agents.spy(@App, "ipc")

        cy
          .get("#login").contains("button", "Login with GitHub").click().then ->
            expect(@App.ipc).to.be.calledWithExactly("window:open", {
              position: "center"
              focus: true
              width: 1000
              height: 635
              preload: false
              title: "Login"
              type: "GITHUB_LOGIN"
            })

      context "on 'window:open' ipc response [007]", ->
        it "displays spinner with 'Logging in...' on ipc response [004]", ->
          cy
            .get("@loginBtn").click().then ->
              @ipc.handle("window:open", null, {})
            .contains("Logging in...")

        it "disables 'Login' button [006]", ->
          cy
            .get("@loginBtn").click().then ->
              @ipc.handle("window:open", null, {})
            .get("@loginBtn").should("be.disabled")

        it "calls 'loggingIn' on user on ipc response [003]", ->
          cy
            .then ->
              @userLogin = @agents.spy(@App.currentUser, "loggingIn")
            .get("@loginBtn").click().then ->
              @ipc.handle("window:open", null, {})
            .contains("Logging in...").then ->
              expect(@userLogin).to.be.called

        it "triggers ipc 'log:in' [008]", ->
          cy
            .get("@loginBtn").click().then ->
              @agents.spy(@App, "ipc")
              @ipc.handle("window:open", null, {})
            .contains("Logging in...").then ->
              expect(@App.ipc).to.be.calledWith("log:in", {})

        describe "on ipc 'log:in' success [00a]", ->
          beforeEach ->
            cy
              .get("@loginBtn").click().then ->
                @ipc.handle("window:open", null, {})
              .contains("Logging in...")

          it "calls 'loggedIn' on user with user [00b]", ->
            cy
              .fixture("user").then (@user) ->
                @loggedIn = @agents.spy(@App.currentUser, "loggedIn")
                @ipc.handle("log:in", null, @user)
              .then ->
                expect(@loggedIn).to.be.calledWith(@user)
                @ipc.handle("get:project:paths", null, [])
              .get("header a").should ($a) ->
                expect($a).to.contain(@user.name)

          it "displays username in UI [00c]", ->
            cy
              .fixture("user").then (@user) ->
                @ipc.handle("log:in", null, @user)
              .then ->
                @ipc.handle("get:project:paths", null, [])
              .get("header a").should ($a) ->
                expect($a).to.contain(@user.name)

        describe "on ipc 'log:in' error [00a]", ->
          beforeEach ->
            cy
              .get("@loginBtn").click().then ->
                @ipc.handle("window:open", null, {})
              .contains("Logging in...")

          it "error: calls 'setLoginError' on user with err [00b]", ->
            cy
              .fixture("user").then (@user) ->
                @loginErr = @agents.spy(@App.currentUser, "setLoginError")
                @ipc.handle("log:in", {message: "There's an error"}, {})
              .then ->
                expect(@loginErr).to.be.calledWith({message: "There's an error"})

          it "displays error in ui [00d]", ->
            cy
              .fixture("user").then (@user) ->
                @loginErr = @agents.spy(@App.currentUser, "setLoginError")
                @ipc.handle("log:in", {message: "There's an error"}, {})
              .get(".alert-danger")
                .should("be.visible")
                .contains("There's an error")

          it "login button should be enabled [00e]", ->
            cy
              .fixture("user").then (@user) ->
                @loginErr = @agents.spy(@App.currentUser, "setLoginError")
                @ipc.handle("log:in", {message: "There's an error"}, {})
              .get("@loginBtn").should("not.be.disabled")

  context "with a current user [02x]", ->
    describe "username [00f]", ->
      it "displays user name [00g]", ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])
          .get("header a").should ($a) ->
            expect($a).to.contain(@user.name)

      it "displays email instead of name [02w]", ->
        cy
          .fixture("user").then (@user) ->
            @user.name = null

            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])
          .get("header a").should ($a) ->
            expect($a).to.contain(@user.email)

    describe "projects list [00h]", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)

      it "displays empty view when no projects [00i]", ->
        cy
          .then ->
            @ipc.handle("get:project:paths", null, [])
          .get(".empty").contains("Add Project")

      context "add project [00j]", ->
        beforeEach ->
          cy
            .then ->
              @ipc.handle("get:project:paths", null, [])
            .get(".empty").contains("Add Project")

        it "triggers ipc 'show:directory:dialog on header + [00k]", ->
          cy.then ->
            @agents.spy(@App, "ipc")
          cy.get("header").find("[data-js='add-project']").click().then ->
            expect(@App.ipc).to.be.calledWith("show:directory:dialog")

        it "triggers ipc 'show:directory:dialog on empty view + [00k]", ->
          cy.then ->
            @agents.spy(@App, "ipc")
          cy.get(".empty").find("[data-js='add-project']").click().then ->
            expect(@App.ipc).to.be.calledWith("show:directory:dialog")

        describe.only "error thrown [00p]", ->
          beforeEach ->
            cy
              .get("header").find("[data-js='add-project']").click().then ->
                @ipc.handle("show:directory:dialog", {message: "something bad happened"}, null)

          it "displays error [00m]", ->
            cy
              .get(".error")
                .should("be.visible")
                .and("contain", "something bad happened")

          it "goes back to projects view on cancel [00q]", ->
            cy
              .get(".error").contains("Cancel").click().then ->
                @ipc.handle("get:project:paths", null, [])
              .get(".empty").should("be.visible")

        describe "directory dialog cancelled [00l]", ->
          beforeEach ->
            cy.get("header").find("[data-js='add-project']").click()

          it "does no action [00m]", ->
            cy
              .then ->
                @agents.spy(@App, "ipc")
                @ipc.handle("show:directory:dialog", null, null)
              .get(".empty").should("exist").then ->
                expect(@App.ipc).to.not.be.calledWith("add:project")

        describe "directory chosen [00n]", ->
          beforeEach ->
            cy.get("header").find("[data-js='add-project']").click()

          it "triggers ipc 'add:project' with directory [00o]", ->
            cy
              .then ->
                @agents.spy(@App, "ipc")
                @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-Fake-Project")
              .get("#projects-container>li:not(.empty)").should("have.length", 1).then ->
                expect(@App.ipc).to.be.calledWith("add:project")





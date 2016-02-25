describe "Projects List [00r]", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  context "with a current user [02x]", ->
    describe "username in header [00f]", ->
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

    describe "logout of user [02i]", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])

      it "shows dropdown on click of user name [02j]", ->
        cy.contains("Jane Lane").click()
        cy.contains("Logout").should("be.visible")

      it.skip "triggers logout on click of logout [02k]", ->
        cy.contains("Jane Lane").click()
        cy.contains("a", "Logout").click().then ->
          expect(@App.ipc).to.be.calledWith("log:out")

      it.skip "displays login screen on logout [02l]", ->
        cy.contains("Jane Lane").click()
        cy.contains("a", "Logout").click()
        cy.contains(".btn", "Login with GitHub")

    describe "no projects [00h]", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])

      it "displays empty view when no projects [00i]", ->
        cy.get(".empty").contains("Add Project")

    describe "lists projects [00h]", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
          .fixture("projects").then (@projects) ->
            @ipc.handle("get:project:paths", null, @projects)

      it "displays projects in list [00i]", ->
        cy
          .get(".empty").should("not.be.visible")
          .get("#projects-container>li").should("have.length", @projects.length)

      it "each project shows it's project path [00s]", ->
        cy
          .get("#projects-container>li").first()
            .should("contain", @projects[0])

      it "each project has it's folder name [00t]", ->
        cy.contains("h4", "My-Fake-Project")

      it "trigger 'open:project' on click of project [00u]", ->
        cy
          .get("#projects-container>li").first().click().then ->
            expect(@App.ipc).to.be.calledWith("open:project")

    describe "add project [00j]", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
            @ipc.handle("get:project:paths", null, [])
          .get(".empty").contains("Add Project")

      it "triggers ipc 'show:directory:dialog on header + [00k]", ->
        cy.get("header").find("[data-js='add-project']").click().then ->
          expect(@App.ipc).to.be.calledWith("show:directory:dialog")

      it "triggers ipc 'show:directory:dialog on empty view + [00k]", ->
        cy.get(".empty").find(".btn[data-js='add-project']").click().then ->
          expect(@App.ipc).to.be.calledWith("show:directory:dialog")

      describe "error thrown [00p]", ->
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
            .contains(".btn", "Go Back").click().then ->
              @ipc.handle("get:project:paths", null, [])
            .get(".empty").should("be.visible")

      describe "directory dialog cancelled [00l]", ->
        beforeEach ->
          cy.get("header").find("[data-js='add-project']").click()

        it "does no action [00m]", ->
          @ipc.handle("show:directory:dialog", null, null)

          cy.get(".empty").should("exist").then ->
              expect(@App.ipc).to.not.be.calledWith("add:project")

      describe "directory chosen [00n]", ->
        beforeEach ->
          cy.get("header").find("[data-js='add-project']").click()

        it "triggers ipc 'add:project' with directory [00o]", ->
          @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-Fake-Project")

          cy.get("#projects-container>li:not(.empty)").should("have.length", 1).then ->
            expect(@App.ipc).to.be.calledWith("add:project")


    describe "remove project [00j]", ->
      beforeEach ->
        cy
          .fixture("user").then (@user) ->
            @ipc.handle("get:current:user", null, @user)
          .fixture("projects").then (@projects) ->
            @ipc.handle("get:project:paths", null, @projects)
          .get("#projects-container>li").first()
            .invoke("trigger", "contextmenu")

      it "displays 'remove' link on right click [02m]", ->
        cy
          .get("a").contains("Remove Project").should("be.visible")

      it "triggers remove:project with path on right click [02o]", ->
        cy
          .get("a").contains("Remove Project").click().then ->
            expect(@App.ipc).to.be.calledWith("remove:project", @projects[0])

      it "removes the project from the list [02p]", ->
        cy
          .get("#projects-container>li").should("have.length", @projects.length)
          .get("a").contains("Remove Project").click()
          .get("#projects-container>li").should("have.length", @projects.length - 1)

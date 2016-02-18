describe "Projects List [00r]", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

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
        @agents.spy(@App, "ipc")

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
        @agents.spy(@App, "ipc")

        cy.get("header").find("[data-js='add-project']").click().then ->
          expect(@App.ipc).to.be.calledWith("show:directory:dialog")

      it "triggers ipc 'show:directory:dialog on empty view + [00k]", ->
        @agents.spy(@App, "ipc")

        cy.get(".empty").find("[data-js='add-project']").click().then ->
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
            .contains(".btn", "Cancel").click().then ->
              @ipc.handle("get:project:paths", null, [])
            .get(".empty").should("be.visible")

      describe "directory dialog cancelled [00l]", ->
        beforeEach ->
          cy.get("header").find("[data-js='add-project']").click()

        it "does no action [00m]", ->
          @agents.spy(@App, "ipc")
          @ipc.handle("show:directory:dialog", null, null)

          cy.get(".empty").should("exist").then ->
              expect(@App.ipc).to.not.be.calledWith("add:project")

      describe "directory chosen [00n]", ->
        beforeEach ->
          cy.get("header").find("[data-js='add-project']").click()

        it "triggers ipc 'add:project' with directory [00o]", ->
          @agents.spy(@App, "ipc")
          @ipc.handle("show:directory:dialog", null, "/Users/Jane/Projects/My-Fake-Project")

          cy.get("#projects-container>li:not(.empty)").should("have.length", 1).then ->
            expect(@App.ipc).to.be.calledWith("add:project")





# {deferred, stubIpc} = require("../support/util")
#
# describe "Update Banner", ->
#   beforeEach ->
#     cy
#       .fixture("user").as("user")
#       .fixture("projects").as("projects")
#       .fixture("projects_statuses").as("projectStatuses")
#       .fixture("config").as("config")
#       .fixture("specs").as("specs")
#       .visit("/#/projects")
#       .window().then (win) ->
#         {@App} = win
#         cy.stub(@App, "ipc").as("ipc")
#
#         @updateCheck = deferred(win.Promise)
#
#         stubIpc(@App.ipc, {
#           "get:options": (stub) => stub.resolves({})
#           "get:current:user": (stub) => stub.resolves(@user)
#           "updater:check": (stub) => stub.returns(@updateCheck.promise)
#           "get:projects": (stub) => stub.resolves(@projects)
#           "get:project:statuses": (stub) => stub.resolves(@projectStatuses)
#         })
#
#         @App.start()
#
#   it "does not display update banner when no update available", ->
#     @updateCheck.resolve(false)
#
#     cy
#       .get("#updates-available").should("not.exist")
#       .get("html").should("not.have.class", "has-updates")
#
#   it "checks for update on show", ->
#     cy.then ->
#       expect(@App.ipc).to.be.calledWith("updater:check")
#
#   it "displays banner if updater:check is new version", ->
#     @updateCheck.resolve("1.3.4")
#     cy.get("#updates-available").should("be.visible")
#     cy.contains("New updates are available")
#     cy
#       .get("html").should("have.class", "has-updates")
#
#   it "triggers open:window on click of Update link", ->
#     @updateCheck.resolve("1.3.4")
#     cy.contains("Update").click().then ->
#       expect(@App.ipc).to.be.calledWith("window:open", {
#         position: "center"
#         width: 300
#         height: 240
#         toolbar: false
#         title: "Updates"
#         type: "UPDATES"
#       })
#
#   it "gracefully handles error", ->
#     @updateCheck.reject({name: "foo", message: "Something bad happened"})
#     cy.get(".footer").should("be.visible")

# require("../../spec_helper")
#
# extension = require("@packages/extension")
# Fixtures = require("../../support/helpers/fixtures")
# project  = require("#{root}../lib/open_project")
# Project  = require("#{root}../lib/project")
# launcher = require("#{root}../lib/launcher")
#
# describe "lib/open_projects", ->
#   beforeEach ->
#     Fixtures.scaffold()
#
#     process.versions.chrome = "2020.0.1776"
#
#     @todosPath = Fixtures.projectPath("todos")
#
#   afterEach ->
#     Fixtures.remove()
#
#     project.close()
#
#   context ".open", ->
#     beforeEach ->
#       @projectInstance = {
#         getConfig: sinon.stub().resolves({proxyUrl: "foo", socketIoRoute: "bar"})
#       }
#
#       browsers = [{
#         name: "chrome"
#         verson: "2077.1.42"
#         path: "/path/to/Chrome.app"
#         majorVersion: "2077"
#       }]
#       sinon.stub(launcher, "getBrowsers").resolves(browsers)
#       sinon.stub(extension, "setHostAndPath").withArgs("foo", "bar").resolves()
#       @open = sinon.stub(Project.prototype, "open").resolves(@projectInstance)
#
#     it "resolves with opened project instance", ->
#       project.open(@todosPath)
#       .then (p) =>
#         expect(p.projectRoot).to.eq(@todosPath)
#         expect(p).to.be.an.instanceOf(Project)
#
#     it "merges options into whitelisted config args", ->
#       args = {port: 2222, baseUrl: "localhost", foo: "bar"}
#       options = {socketId: 123, port: 2020}
#       project.open(@todosPath, args, options)
#       .then =>
#         expect(@open).to.be.calledWithMatch({
#           port: 2020
#           socketId: 123
#           baseUrl: "localhost"
#           sync: true
#         })
#         expect(@open.getCall(0).args[0].onReloadBrowser).to.be.a("function")
#
#     it "passes onReloadBrowser which calls relaunch with url + browser", ->
#       relaunch = sinon.stub(project, "relaunch")
#
#       project.open(@todosPath)
#       .then =>
#         @open.getCall(0).args[0].onReloadBrowser("foo", "bar")
#         expect(relaunch).to.be.calledWith("foo", "bar")
#
#     it "opens project with available browsers, appending electron browser", ->
#       project.open(@todosPath)
#       .then =>
#         browsers = @open.lastCall.args[0].browsers
#         expect(browsers.length).to.equal(2)
#         expect(browsers[0].name).to.equal("chrome")
#         expect(browsers[1].name).to.equal("electron")
#
#     it "electron browser has info explaining what it is", ->
#       project.open(@todosPath)
#       .then =>
#         electron = @open.lastCall.args[0].browsers[1]
#         expect(electron.info).to.include("version of Chrome")
#
#   context ".close", ->

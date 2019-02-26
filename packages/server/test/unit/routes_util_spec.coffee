require("../spec_helper")

routes = require("#{root}/lib/util/routes")

describe "lib/util/routes", ->
  it "api", ->
    expect(routes.api()).to.eq "http://localhost:1234/"

  it "auth", ->
    expect(routes.auth()).to.eq "http://localhost:1234/auth"

  it "ping", ->
    expect(routes.ping()).to.eq("http://localhost:1234/ping")

  it "signin", ->
    expect(routes.signin()).to.eq "http://localhost:1234/signin"

  it "signin?code=abc", ->
    expect(routes.signin({code: "abc"})).to.eq "http://localhost:1234/signin?code=abc"

  it "signout", ->
    expect(routes.signout()).to.eq "http://localhost:1234/signout"

  it "runs", ->
    expect(routes.runs()).to.eq("http://localhost:1234/runs")

  it "instances", ->
    expect(routes.instances(123)).to.eq("http://localhost:1234/runs/123/instances")

  it "instance", ->
    expect(routes.instance(123)).to.eq("http://localhost:1234/instances/123")

  it "projects", ->
    expect(routes.projects()).to.eq "http://localhost:1234/projects"

  it "project", ->
    expect(routes.project("123-foo")).to.eq "http://localhost:1234/projects/123-foo"

  it "projectRuns", ->
    expect(routes.projectRuns("123-foo")).to.eq "http://localhost:1234/projects/123-foo/runs"

  it "projectToken", ->
    expect(routes.projectToken("123-foo")).to.eq "http://localhost:1234/projects/123-foo/token"

  it "exceptions", ->
    expect(routes.exceptions()).to.eq "http://localhost:1234/exceptions"

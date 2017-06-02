require("../spec_helper")

Routes = require("#{root}/lib/util/routes")

describe "lib/util/routes", ->
  it "api", ->
    expect(Routes.api()).to.eq "http://localhost:1234/"

  it "auth", ->
    expect(Routes.auth()).to.eq "http://localhost:1234/auth"

  it "ping", ->
    expect(Routes.ping()).to.eq("http://localhost:1234/ping")

  it "signin", ->
    expect(Routes.signin()).to.eq "http://localhost:1234/signin"

  it "signin?code=abc", ->
    expect(Routes.signin({code: "abc"})).to.eq "http://localhost:1234/signin?code=abc"

  it "signout", ->
    expect(Routes.signout()).to.eq "http://localhost:1234/signout"

  it "runs", ->
    expect(Routes.runs()).to.eq("http://localhost:1234/builds")

  it "instances", ->
    expect(Routes.instances(123)).to.eq("http://localhost:1234/builds/123/instances")

  it "instance", ->
    expect(Routes.instance(123)).to.eq("http://localhost:1234/instances/123")

  it "projects", ->
    expect(Routes.projects()).to.eq "http://localhost:1234/projects"

  it "project", ->
    expect(Routes.project("123-foo")).to.eq "http://localhost:1234/projects/123-foo"

  it "projectToken", ->
    expect(Routes.projectToken("123-foo")).to.eq "http://localhost:1234/projects/123-foo/token"

  it "exceptions", ->
    expect(Routes.exceptions()).to.eq "http://localhost:1234/exceptions"

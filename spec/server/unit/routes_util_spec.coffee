root   = "../../../"
expect = require("chai").expect
Routes = require("#{root}/lib/util/routes")

describe "Routes Util", ->
  it "signin", ->
    expect(Routes.signin()).to.eq "http://localhost:1234/signin"

  it "signin?code=abc", ->
    expect(Routes.signin({code: "abc"})).to.eq "http://localhost:1234/signin?code=abc"

  it "api", ->
    expect(Routes.api()).to.eq "http://localhost:1234"

  it "signout", ->
    expect(Routes.signout()).to.eq "http://localhost:1234/signout"

  it "exceptions", ->
    expect(Routes.exceptions()).to.eq "http://localhost:1234/exceptions"

  it "projects", ->
    expect(Routes.projects()).to.eq "http://localhost:1234/projects"

  it "project", ->
    expect(Routes.project("123-foo")).to.eq "http://localhost:1234/projects/123-foo"

  it "projectToken", ->
    expect(Routes.projectToken("123-foo")).to.eq "http://localhost:1234/projects/123-foo/token"

  it "projectKeys", ->
    expect(Routes.projectKeys("123-foo")).to.eq "http://localhost:1234/projects/123-foo/keys"

  it "ci", ->
    expect(Routes.ci("123-foo")).to.eq "http://localhost:1234/ci/123-foo"

  it "tests", ->
    expect(Routes.tests("123-guid")).to.eq "http://localhost:1234/tests/123-guid"
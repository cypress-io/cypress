root   = "../../../"
expect = require("chai").expect
Routes = require("#{root}/lib/util/routes")

describe "Routes", ->
  it "signin", ->
    expect(Routes.signin()).to.eq "http://localhost:1234/signin"

  it "signin?code=abc", ->
    expect(Routes.signin({code: "abc"})).to.eq "http://localhost:1234/signin?code=abc"

  it "api", ->
    expect(Routes.api()).to.eq "http://localhost:1234"
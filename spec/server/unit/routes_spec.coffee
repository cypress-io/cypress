root   = "../../../"
expect = require("chai").expect
Routes = require("#{root}/lib/util/routes")

describe "Routes", ->
  it "signup", ->
    expect(Routes.signup()).to.eq "http://localhost:1234/signup"

  it "signup?code=abc", ->
    expect(Routes.signup({code: "abc"})).to.eq "http://localhost:1234/signup?code=abc"

  it "api", ->
    expect(Routes.api()).to.eq "http://localhost:1234"
root           = "../../../"
pkg            = require("#{root}package")

describe "the package.json", ->
  it "includes mocha as dependency", ->
    expect(pkg.dependencies).to.include.keys("mocha")
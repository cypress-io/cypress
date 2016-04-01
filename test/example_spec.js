var example = require("../index")
var expect = require("chai").expect

var cwd = process.cwd()

describe("Cypress Example", function(){
  it("returns path to example_spec", function(){
    expect(example.getPathToExample()).to.eq(cwd + "/cypress/integration/example_spec.js")
  })
})

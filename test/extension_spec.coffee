extension = require("../index")
expect    = require("chai").expect

cwd = process.cwd()

describe "Extension", ->
  it "returns path to dist", ->
    expect(extension.getPathToExtension()).to.eq(cwd + "/dist")
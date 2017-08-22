require("../../support/unit_spec_helper")

$SetterGetter = require("#{src}/cypress/setter_getter")

describe "src/cypress/setter_getter", ->
  beforeEach ->
    @sg = $SetterGetter.create({})

  it "sets by key/val", ->
    @sg("foo", "bar")
    expect(@sg("foo")).to.eq("bar")

  it "sets by object", ->
    @sg({foo: "bar"})
    expect(@sg("foo")).to.eq("bar")

  it "gets entire sg", ->
    @sg({foo: "bar", bar: "baz"})
    expect(@sg()).to.deep.eq({foo: "bar", bar: "baz"})

  it "returns value", ->
    expect(@sg("foo", "bar")).to.eq("bar")

  it "returns object", ->
    @sg("foo", "bar")
    expect(@sg({baz: "quux"})).to.deep.eq({baz: "quux"})

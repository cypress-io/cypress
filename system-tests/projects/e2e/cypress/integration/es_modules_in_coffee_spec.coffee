foo = require("../../lib/foo")
bar = require("../../lib/bar")
dom = require("../../lib/dom")

describe "imports work", ->
  it "foo coffee", ->
    expect(foo()).to.eq("foo")

  it "bar babel", ->
    expect(bar()).to.eq("baz")

  it "dom jsx", ->
    expect(dom).to.eq("dom")

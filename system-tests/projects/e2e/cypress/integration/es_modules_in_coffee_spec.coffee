foo = require("@packages/server/lib/foo")
bar = require("@packages/server/lib/bar")
dom = require("@packages/server/lib/dom")

describe "imports work", ->
  it "foo coffee", ->
    expect(foo()).to.eq("foo")

  it "bar babel", ->
    expect(bar()).to.eq("baz")

  it "dom jsx", ->
    expect(dom).to.eq("dom")

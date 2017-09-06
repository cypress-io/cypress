require("../spec_helper")

nodeCache = require("#{root}lib/node_cache")

describe "lib/node_cache", ->
  it "clears node cache so package is re-required", ->
    expect(nodeCache.require("../test/fixtures/node_cache_1")()).to.equal(1)
    expect(nodeCache.require("../test/fixtures/node_cache_1")()).to.equal(2)
    nodeCache.clear("../test/fixtures/node_cache_1")
    expect(nodeCache.require("../test/fixtures/node_cache_1")()).to.equal(1)

  it "clears dependencies unique to required package", ->
    delete require.cache[require.resolve("../fixtures/node_cache_3")]
    nodeCache.require("../test/fixtures/node_cache_1")
    nodeCache.require("../test/fixtures/node_cache_2")
    nodeCache.clear("../test/fixtures/node_cache_1")
    expect(require.cache[require.resolve("lodash")]).to.be.an("object")
    expect(require.cache[require.resolve("../fixtures/node_cache_3")]).to.be.undefined

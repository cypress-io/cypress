require("../spec_helper")

path     = require("path")
Fixtures = require("../support/helpers/fixtures")
ids      = require("#{root}lib/ids")

describe "lib/ids", ->
  beforeEach ->
    Fixtures.scaffold()

    @testIdsPath = path.join(Fixtures.projectPath("ids"), "cypress", "integration")

  afterEach ->
    Fixtures.remove()

  context ".get", ->
    it "returns an array of ids", ->
      ids.get(@testIdsPath)
      .then (array) ->
        expect(array).to.include(" [000]", " [001]", " [002]", "[i9w]", "[abc]")

    it "returns stats", ->
      ids.remove(@testIdsPath)
      .then (stats) ->
        expect(stats).to.deep.eq({
          ids: 5
          files: 2
        })

    it "removes ids", ->
      ids
      .get(@testIdsPath)
      .then (array) =>
        expect(array.length).to.be.gt(0)

        ids.remove(@testIdsPath)
      .then =>
        ids.get(@testIdsPath)
        .then (array) ->
          expect(array.length).to.eq(0)

    it "strips out whitespace next to the id", ->
      foo = path.join(@testIdsPath, "foo.coffee")

      ids.remove(@testIdsPath)
      .then =>
        fs.readFileAsync(foo, "utf8").then (contents) ->
          expect(contents).to.eq """
          describe "foo", ->
            it "bars", ->

            it 'quux'
          """

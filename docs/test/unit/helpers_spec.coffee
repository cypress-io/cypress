require("../spec_helper")

helpers = require("../../lib/helpers")

describe "lib/helpers", ->
  context "addPageAnchors", ->
    expects = (str, expected) ->
      expect(helpers.addPageAnchors(str)).to.eq(expected)

    it "is noop if no headings found", ->
      expects(
        "<p>foo</p>",
        "<p>foo</p>"
      )

    it "does not wrap with <html>", ->
      expects(
        '<h1 id="bar">foo</h1>',
        '<h1 id="bar" class="article-heading">foo<a class="article-anchor" href="#bar" aria-hidden="true"></a></h1>'
      )

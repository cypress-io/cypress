require("../spec_helper")

helpers = require("../../lib/helpers")

describe "lib/helpers", ->
  context "addPageAnchors", ->
    wrap = (html) ->
      "<html><head></head><body>#{html}</body></html>"

    expects = (str, expected) ->
      expect(helpers.addPageAnchors(str)).to.eq(expected)

    it "is noop if no headings found", ->
      expects(
        "<p>foo</p>",
        "<p>foo</p>"
      )

    it "does not wrap with <html>", ->
      # despite what cheerio says, it does wrap in <HTML>...
      expects(
        '<h1 id="bar">foo</h1>',
        wrap('<h1 id="bar" class="article-heading">foo<a class="article-anchor" href="#bar" aria-hidden="true"></a></h1>')
      )

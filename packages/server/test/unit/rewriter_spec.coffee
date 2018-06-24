require("../spec_helper")

rewriter = require("#{root}lib/util/rewriter")
inject = require("#{root}lib/util/inject")

describe "src/server/lib/rewriter", ->

  context "html", ->
    contentToInject = "<injected-content>"

    expectInjectedContent = (html) ->
      expect(html).to.match(
        new RegExp("<head>.*#{contentToInject}.*</head>"),
        "Injected content was not injected into the existing head element"
      )

    beforeEach ->
      sinon.stub(inject, "partial").returns(contentToInject)

    it "injects content into the existing head element if one exists", ->
      htmlWithHead = '
        <html>
          <head><meta src="test"/></head>
          <body></body>
        </html>
      '

      result = rewriter.html(htmlWithHead, "mydomain.com", "partial", false)
      expectInjectedContent result
      expect(result).to.include('<meta src="test"/>')

    it "creates its own head element with the injected content if no head element is found", ->
      htmlWithoutHead = "
        <html>
          <body>
          </body>
        </html>
      "
      expectInjectedContent rewriter.html(htmlWithoutHead, "mydomain.com", "partial", false)

    it "creates the head and body elements with the injected content if no body or head element is found", ->
      htmlWithoutHeadOrBody = "<html></html>"
      expectInjectedContent rewriter.html(htmlWithoutHeadOrBody, "mydomain.com", "partial", false)

    it "appends a head element with the injected content if no html, body, or head element is found", ->
      domFragment = "<p>Some DOM fragment</p>"
      expectInjectedContent rewriter.html(domFragment, "mydomain.com", "partial", false)

    # Regression test
    it "does not mistake a <header> element for a <head> element", ->
      htmlWithHeader = "
        <html>
          <body>
            <header>Hello, World</header>
          </body>
        </html>
      "
      expectInjectedContent rewriter.html(htmlWithHeader, "mydomain.com", "partial", false)

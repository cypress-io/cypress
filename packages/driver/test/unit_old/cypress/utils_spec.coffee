{ $ } = window.testUtils

describe "$Cypress.utils API", ->
  enterCommandTestingMode()

  context "#throwErrByPath", ->
    beforeEach ->
      $Cypress.ErrorMessages.__test_errors = {
        simple: "This is a simple error message"
        with_args: "The has args like '{{foo}}' and {{bar}}"
        with_multi_args: "This has args like '{{foo}}' and {{bar}}, and '{{foo}}' is used twice"
      }

    describe "when error message path does not exist", ->

      it "has an err.name of InternalError", ->
        try
          $Cypress.utils.throwErrByPath("not.there")
        catch e
          expect(e.name).to.eq "InternalError"

      it "has the right message", ->
        try
          $Cypress.utils.throwErrByPath("not.there")
        catch e
          expect(e.message).to.include "Error message path 'not.there' does not exist"

    describe "when error message path exists", ->

      it "has an err.name of CypressError", ->
        try
          $Cypress.utils.throwErrByPath("__test_errors.simple")
        catch e
          expect(e.name).to.eq "CypressError"

      it "has the right message", ->
        try
          $Cypress.utils.throwErrByPath("__test_errors.simple")
        catch e
          expect(e.message).to.include "This is a simple error message"

    describe "when args are provided for the error", ->

      it "uses them in the error message", ->
        try
          $Cypress.utils.throwErrByPath("__test_errors.with_args", {
            args: { foo: "foo", bar: ["bar", "qux"]  }
          })
        catch e
          expect(e.message).to.include "The has args like 'foo' and bar,qux"

    describe "when args are provided for the error and some are used multiple times in message", ->

      it "uses them in the error message", ->
        try
          $Cypress.utils.throwErrByPath("__test_errors.with_multi_args", {
            args: { foo: "foo", bar: ["bar", "qux"]  }
          })
        catch e
          expect(e.message).to.include "This has args like 'foo' and bar,qux, and 'foo' is used twice"

    describe "when onFail is provided as a function", ->

      it "attaches the function to the error", ->
        onFail = ->
        try
          $Cypress.utils.throwErrByPath("window.iframe_undefined", { onFail })
        catch e
          expect(e.onFail).to.equal onFail

    describe "when onFail is provided as a command", ->

      it "attaches the handler to the error", ->
        command = { error: @sandbox.spy() }
        try
          $Cypress.utils.throwErrByPath("window.iframe_undefined", { onFail: command })
        catch e
          e.onFail("the error")
          expect(command.error).to.be.calledWith("the error")

  context "#throwErr", ->

    it "throws the error as sent", ->
      try
        $Cypress.utils.throwErr("Something unexpected")
      catch e
        expect(e.message).to.include "Something unexpected"
        expect(e.name).to.eq "CypressError"

  describe "#filterOutOptions", ->
    it "returns new obj based on the delta from the filter", ->
      obj = $Cypress.utils.filterOutOptions {visible: true, exist: false, foo: "bar"}, {visible: null, exist: false}
      expect(obj).to.deep.eq {visible: true}

    it "returns undefined if nothing is different", ->
      obj = $Cypress.utils.filterOutOptions {foo: "foo", bar: "bar"}, {foo: "foo"}
      expect(obj).to.be.undefined

    it "normalizes objects with length property", ->
      obj = $Cypress.utils.filterOutOptions {exist: true}, {visible: null, exist: false, length: null}
      expect(obj).to.deep.eq {exist: true}

  describe "#stringify", ->
    beforeEach ->
      @str = (str) ->
        $Cypress.utils.stringify(str)

    context "Values", ->
      it "string", ->
        expect(@str("foo bar baz")).to.eq "foo bar baz"

      it "number", ->
        expect(@str(1234)).to.eq "1234"

      it "null", ->
        expect(@str(null)).to.eq "null"

      ## QUESTION: is this really the behavior we want? wouldn't 'undefined' be better?
      it "undefined", ->
        expect(@str(undefined)).to.eq ""

      it "symbol", ->
        expect(@str(Symbol.iterator)).to.eq("Symbol")

    context "Arrays", ->
      it "length <= 3", ->
        a = [["one", 2, "three"]]
        expect(@str(a)).to.eq "[one, 2, three]"

      it "length > 3", ->
        a = [[1,2,3,4,5]]
        expect(@str(a)).to.eq "Array[5]"

    context "Objects", ->
      it "keys <= 2", ->
        o = {visible: null, exists: true}
        expect(@str(o)).to.eq "{visible: null, exists: true}"

      it "keys > 2", ->
        o = {foo: "foo", bar: "baz", baz: "baz"}
        expect(@str(o)).to.eq "Object{3}"

      it "can have length property", ->
        o = {length: 10, foo: "bar"}
        expect(@str(o)).to.eq "{foo: bar, length: 10}"

    context "Functions", ->
      it "function(){}", ->
        o = (foo, bar, baz) ->
        expect(@str(o)).to.eq "function(){}"

    context "Elements", ->
      it "stringifyElement", ->
        o = $("div:first")
        expect(@str(o)).to.eq "<div#mocha>"

  describe "#hasElement", ->
    it "is true on jQuery objects", ->
      body = @cy.$$("body")
      expect($Cypress.utils.hasElement(body)).to.be.true

    it "is true on DOM objects", ->
      body = @cy.$$("body").get(0)
      expect($Cypress.utils.hasElement(body)).to.be.true

    _.each [{}, [], [{}], 1, "", true], (value) ->
      it "is false on: #{typeof value}", ->
        expect($Cypress.utils.hasElement(value)).to.be.false

  describe "#stringifyElement", ->
    it "returns <window>", ->
      str = $Cypress.utils.stringifyElement(window)
      expect(str).to.eq("<window>")

    it "returns <document>", ->
      str = $Cypress.utils.stringifyElement(document)
      expect(str).to.eq("<document>")

    context "long form", ->
      it "includes wraps element in gt/ls", ->
        input = $("<input />")
        @cy.$$("body").append(input)

        str = $Cypress.utils.stringifyElement(input)
        expect(str).to.eq "<input>"

    context "short form", ->
      it "returns element", ->
        body = @cy.$$("body")

        str = $Cypress.utils.stringifyElement(body, "short")
        expect(str).to.eq "<body>"

      it "returns element + id", ->
        div = $("<div id='id' />")
        @cy.$$("body").append(div)

        str = $Cypress.utils.stringifyElement(div, "short")
        expect(str).to.eq "<div#id>"

      it "uses element class", ->
        div = $("<div class='class foo bar' />")
        @cy.$$("body").append(div)

        str = $Cypress.utils.stringifyElement(div, "short")
        expect(str).to.eq "<div.class.foo.bar>"

      it "uses name, id, and class", ->
        div = $("<div id='baz' class='foo' />")
        @cy.$$("body").append(div)

        str = $Cypress.utils.stringifyElement(div, "short")
        expect(str).to.eq "<div#baz.foo>"

      it "can stringify svg", ->
        svg = $('<svg id="svg123" class="icon icon-svg" width="100" height="100"><rect class="node" fill="red" width="50" height="50" x="25" y="25"></rect></svg>')
        @cy.$$("body").append(svg)

        str = $Cypress.utils.stringifyElement(svg, "short")
        expect(str).to.eq("<svg#svg123.icon.icon-svg>")

      it "gets updated class names", ->
        div = $("<div id='baz' class='foo' />")
        div.prop("class", "foo bar")
        @cy.$$("body").append(div)

        str = $Cypress.utils.stringifyElement(div, "short")
        expect(str).to.eq("<div#baz.foo.bar>")

      it "returns array of els", ->
        lis = @cy.$$("li")

        str = $Cypress.utils.stringifyElement(lis, "short")
        expect(str).to.eq "[ <li.item>, #{lis.length - 1} more... ]"

      it "stringifies array of elements", ->
        appendButton = =>
          @cy.$("body").append $("<button class='stringify'>b</button>")

        _.times 3, appendButton

        btns = @cy.$$(".stringify")
        str  = $Cypress.utils.stringifyElement(btns, "short")
        expect(str).to.eq "[ <button.stringify>, 2 more... ]"

    context "#convertHtmlTags", ->
      it "converts opening brackets to tags", ->
        html = $Cypress.utils.convertHtmlTags "[strong]foo"
        expect(html).to.eq "<strong>foo"

      it "converts closing brackets to tags", ->
        html = $Cypress.utils.convertHtmlTags "foo[/strong]"
        expect(html).to.eq "foo</strong>"

      it "converts opening brackets with attrs", ->
        html = $Cypress.utils.convertHtmlTags "[i class='fa-circle']foo"
        expect(html).to.eq "<i class='fa-circle'>foo"

  describe "#plural", ->

  describe "#getObjValueByPath", ->
    beforeEach ->
      @obj =
        foo: 'foo'
        bar:
          baz:
            qux: 'qux'

    it 'throws if object not provided as first argument', ->
      expect(-> $Cypress.utils.getObjValueByPath("foo")).to.throw "The first parameter to utils.getObjValueByPath() must be an object"

    it 'throws if path not provided as second argument', ->
      expect(=> $Cypress.utils.getObjValueByPath(@obj)).to.throw "The second parameter to utils.getObjValueByPath() must be a string"

    it 'returns value for shallow path', ->
      expect($Cypress.utils.getObjValueByPath @obj, 'foo').to.equal 'foo'

    it 'returns value for deeper path', ->
      expect($Cypress.utils.getObjValueByPath @obj, 'bar.baz.qux').to.equal 'qux'

    it 'returns undefined for non-existent shallow path', ->
      expect($Cypress.utils.getObjValueByPath @obj, 'nope').to.be.undefined

    it 'returns undefined for non-existent deeper path', ->
      expect($Cypress.utils.getObjValueByPath @obj, 'bar.baz.nope').to.be.undefined

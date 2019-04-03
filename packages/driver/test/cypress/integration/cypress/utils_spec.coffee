_ = Cypress._
$utils = Cypress.utils

describe "driver/src/cypress/utils", ->
  context ".filterOutOptions", ->
    it "returns new obj based on the delta from the filter", ->
      obj = $utils.filterOutOptions {visible: true, exist: false, foo: "bar"}, {visible: null, exist: false}
      expect(obj).to.deep.eq {visible: true}

    it "returns undefined if nothing is different", ->
      obj = $utils.filterOutOptions {foo: "foo", bar: "bar"}, {foo: "foo"}
      expect(obj).to.be.undefined

    it "normalizes objects with length property", ->
      obj = $utils.filterOutOptions {exist: true}, {visible: null, exist: false, length: null}
      expect(obj).to.deep.eq {exist: true}

  context ".stringify", ->
    beforeEach ->
      @str = (str) ->
        $utils.stringify(str)

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

    # context "Elements", ->
    #   it "stringifyElement", ->
    #     o = $("div:first")
    #     expect(@str(o)).to.eq "<div#mocha>"

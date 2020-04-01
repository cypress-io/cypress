LimitedMap = require("../../../../src/util/limited_map")

_ = Cypress._
$utils = Cypress.utils

stackWithoutMessage = (err) ->
  err.stack.replace("#{err.toString()}\n", "")

describe "driver/src/cypress/utils", ->
  context ".reduceProps", ->
    it "reduces obj to only include props in props", ->
      obj = {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz'
      }

      obj = $utils.reduceProps(obj, ['foo', 'bar'])
      expect(obj).to.deep.eq {foo: 'foo', bar: 'bar'}

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

    context "Elements", ->
      it "stringifyElement", ->
        cy.visit("/fixtures/dom.html").then ->
          o = Cypress.$("#dom")
          expect(@str(o)).to.eq "<div#dom>"

  context ".memoize", ->
    it "runs the function the first time", ->
      fn = cy.stub().returns("output")
      memoizedFn = $utils.memoize(fn)
      result = memoizedFn("input")
      expect(fn).to.be.calledWith("input")
      expect(result).to.equal("output")

    it "runs the function for unique first arguments", ->
      fn = cy.stub().returns("output")
      memoizedFn = $utils.memoize(fn)
      result1 = memoizedFn("input-1")
      result2 = memoizedFn("input-2")
      expect(fn).to.be.calledWith("input-1")
      expect(fn).to.be.calledWith("input-2")
      expect(fn).to.be.calledTwice
      expect(result1).to.equal("output")
      expect(result2).to.equal("output")

    it "returns cached return value if first argument is the same", ->
      fn = cy.stub().returns("output")
      memoizedFn = $utils.memoize(fn)
      result1 = memoizedFn("input")
      result2 = memoizedFn("input")
      expect(fn).to.be.calledWith("input")
      expect(fn).to.be.calledOnce
      expect(result1).to.equal("output")
      expect(result2).to.equal("output")

    it "accepts a cache instance to use as the second argument", ->
      fn = cy.stub().returns("output")
      ## LimitedMap(2) only holds on to 2 items at a time and clears older ones
      memoizedFn = $utils.memoize(fn, new LimitedMap(2))
      memoizedFn("input-1")
      memoizedFn("input-2")
      expect(fn).to.be.calledTwice
      memoizedFn("input-3")
      expect(fn).to.be.calledThrice
      memoizedFn("input-1")
      ## cache for input-1 is cleared, so it calls the function again
      expect(fn.callCount).to.be.equal(4)

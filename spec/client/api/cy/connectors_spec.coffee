describe "$Cypress.Cy Connectors Commands", ->
  enterCommandTestingMode()

  context "#spread", ->
    it "spreads an array into individual arguments", ->
      cy.noop([1,2,3]).spread (one, two, three) ->
        expect(one).to.eq(1)
        expect(two).to.eq(2)
        expect(three).to.eq(3)

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when subject isn't an array", (done) ->
        @cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.spread() requires the existing subject be an array!"
          done()

        @cy.noop({}).spread ->

  context "#then", ->
    it "mocha inserts 2 arguments to then: anonymous fn for invoking done(), and done reference itself", ->
      ## this puts tests in place to where if mocha
      ## ever updates and changes how it calls .then
      ## on the returned object, we will know

      @cy.then ->
        expect(@cy.commands.length).to.eq 2

        lastThen = @cy.commands.last()

        expect(lastThen.get("args")[0]).to.be.a.function
        expect(lastThen.get("args")[1].length).to.eq 1

        ## if our browser supports the .name property
        ## of a function, then test it too to make
        ## sure its called 'done'
        if name = lastThen.get("args")[1].name
          expect(name).to.eq "done"

    it "assigns prop next if .then matched what would be added by mocha", (done) ->
      fn = (err) ->

      @cy.on "end", ->
        expect(@prop("next")).not.to.be.undefined
        done()

      @cy.noop().then((->), fn)

    describe "yields to remote jQuery subject", ->
      beforeEach ->
        ## set the jquery path back to our
        ## remote window
        @Cypress.option "jQuery", @$iframe.prop("contentWindow").$

        @remoteWindow = @cy.private("window")

      afterEach ->
        ## restore back to the global $
        @Cypress.option "jQuery", $

      it "calls the callback function with the remote jQuery subject", ->
        @remoteWindow.$.fn.foo = fn = ->

        @cy
          .get("input:first").then ($input) ->
            expectOriginal($input).to.be.instanceof @remoteWindow.$
            expectOriginal($input).to.have.property "foo", fn

      it "continues to pass the remote jQuery object downstream", ->
        @cy
          .get("input:first").then ($input) ->
            expectOriginal($input).to.be.instanceof @remoteWindow.$
            return $input
          .then ($input) ->
            expectOriginal($input).to.be.instanceof @remoteWindow.$

      it "does not store the remote jquery object as the subject", ->
        @cy
          .get("input:first").then ($input) ->
            expectOriginal($input).to.be.instanceof @remoteWindow.$
            return $input
          .then ($input) ->
            expectOriginal(@cy.prop("subject")).not.to.be.instanceof @remoteWindow.$
            expectOriginal(@cy.prop("subject")).to.be.instanceof window.$

      it "does not nuke selector properties", ->
        @cy
          .get("input:first").then ($input) ->
            expectOriginal($input.selector).to.eq "input:first"
            return $input
          .then ($input) ->
            expectOriginal($input.selector).to.eq "input:first"

  context "#invoke", ->
    beforeEach ->
      ## set the jquery path back to our
      ## remote window
      @Cypress.option "jQuery", @$iframe.prop("contentWindow").$

      @remoteWindow = @cy.private("window")

    afterEach ->
      ## restore back to the global $
      @Cypress.option "jQuery", $

    describe "assertion verification", ->
      beforeEach ->
        delete @remoteWindow.$.fn.foo

        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, =>
          @remoteWindow.$.fn.foo = -> "foo"

        @cy.get("input:first").invoke("foo").should("eq", "foo").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "retry", _.after 2, =>
          @remoteWindow.$.fn.foo = -> "foo"

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get("input:first").invoke("foo").should("eq", "bar")

      it "can still fail on invoke", (done) ->
        @Cypress.on "log", (@log) =>

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("invoke")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get("input:first").invoke("foobarbaz")

      it "does not log an additional log on failure", (done) ->
        @remoteWindow.$.fn.foo = -> "foo"

        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get("input:first").invoke("foo").should("eq", "bar")

    describe "remote DOM subjects", ->
      it "is invoked on the remote DOM subject", ->
        @remoteWindow.$.fn.foo = -> "foo"

        @cy.get("input:first").invoke("foo").then (str) ->
          expect(str).to.eq "foo"

      it "re-wraps the remote element if its returned", ->
        parent = @cy.$("input:first").parent()
        expect(parent).to.exist

        @cy.get("input:first").invoke("parent").then ($parent) ->
          expectOriginal($parent).to.be.instanceof @remoteWindow.$
          expect(@cy.prop("subject")).to.match parent

    describe "function property", ->
      beforeEach ->
        @obj = {
          foo: -> "foo"
          bar: (num1, num2) -> num1 + num2
          err: -> throw new Error("fn.err failed!")
          baz: 10
        }

      it "changes subject to function invocation", ->
        @cy.noop(@obj).invoke("foo").then (str) ->
          expect(str).to.eq "foo"

      it "forwards any additional arguments", ->
        @cy.noop(@obj).invoke("bar", 1, 2).then (num) ->
          expect(num).to.eq 3

      it "changes subject to undefined", ->
        obj = {
          bar: -> undefined
        }

        @cy.noop(obj).invoke("bar").then (val) ->
          expect(val).to.be.undefined

      describe "errors", ->
        beforeEach ->
          @allowErrors()
          @currentTest.timeout(200)

        it "bubbles up automatically", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "fn.err failed!"
            done()

          @cy.noop(@obj).invoke("err")

    describe "regular property", ->
      beforeEach ->
        @obj = {
          baz: 10
        }

      it "returns undefined", ->
        @cy.noop({foo: undefined}).invoke("foo").then (val) ->
          expect(val).to.be.undefined

      it "returns property", ->
        @cy.noop(@obj).invoke("baz").then (num) ->
          expect(num).to.eq @obj.baz

      it "returns property on remote subject", ->
        @remoteWindow.$.fn.baz = 123

        @cy.get("div:first").invoke("baz").then (num) ->
          expect(num).to.eq 123

      it "handles string subjects", ->
        str = "foobarbaz"

        @cy.noop(str).invoke("length").then (num) ->
          expect(num).to.eq str.length

      it "handles properties on the prototype", ->
        num = new Number(10)

        @cy.noop(num).invoke("valueOf").then (num) ->
          expect(num).to.eq 10

    describe ".log", ->
      beforeEach ->
        @obj = {
          foo: "foo bar baz"
          num: 123
          bar: -> "bar"
          attr: (key, value) ->
            obj = {}
            obj[key] = value
            obj
          sum: (args...) ->
            _.reduce args, (memo, num) ->
              memo + num
            , 0
        }

        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (log) ->
          if log.get("name") is "invoke"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq "foo"
            done()

        @cy.noop({foo: "foo"}).invoke("foo")

      it "snapshots after invoking", ->
        @cy.noop({foo: "foo"}).invoke("foo").then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "ends", ->
        @cy.noop({foo: "foo"}).invoke("foo").then ->
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "logs $el if subject is element", ->
        @cy.get("button:first").invoke("hide").then ($el) ->
          expect(@log.get("$el").get(0)).to.eq $el.get(0)

      it "does not log $el if subject isnt element", ->
        @cy.noop(@obj).invoke("bar").then ->
          expect(@log.get("$el")).not.to.exist

      it "logs obj as a property", ->
        @cy.noop(@obj).invoke("foo").then ->
          obj = {
            name: "invoke"
            message: ".foo"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "logs obj as a function", ->
        @cy.noop(@obj).invoke("bar").then ->
          obj = {
            name: "invoke"
            message: ".bar()"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "logs obj with arguments", ->
        @cy.noop(@obj).invoke("attr", "numbers", [1,2,3]).then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command:  "invoke"
            Function: ".attr(numbers, [1, 2, 3])"
            "With Arguments": ["numbers", [1,2,3]]
            On:       @obj
            Returned: {numbers: [1,2,3]}
          }


      it "#onConsole as a regular property", ->
        @cy.noop(@obj).invoke("num").then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command:  "invoke"
            Property: ".num"
            On:       @obj
            Returned: 123
          }

      it "#onConsole as a function property without args", ->
        @cy.noop(@obj).invoke("bar").then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command:  "invoke"
            Function: ".bar()"
            On:       @obj
            Returned: "bar"
          }

      it "#onConsole as a function property with args", ->
        @cy.noop(@obj).invoke("sum", 1, 2, 3).then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command:  "invoke"
            Function: ".sum(1, 2, 3)"
            "With Arguments": [1,2,3]
            On:       @obj
            Returned: 6
          }

      it "#onConsole as a function on DOM element", ->
        @cy.get("button:first").invoke("hide").then ($btn) ->
          onConsole = @log.attributes.onConsole()
          expect(onConsole).to.deep.eq {
            Command: "invoke"
            Function: ".hide()"
            On: $btn.get(0)
            Returned: $btn.get(0)
          }

    describe "errors", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>
        @allowErrors()
        @currentTest.timeout(200)

      it "throws when property does not exist on the subject", (done) ->
        @cy.on "fail", (err) =>
          expect(err.message).to.include "cy.invoke() errored because the property: 'foo' does not exist on your subject."
          expect(@log.get("error")).to.include err
          done()

        @cy.noop({}).invoke("foo")

      it "throws without a subject (even as a dual command)", (done) ->
        @cy.on "invoke:start", (obj) =>
          obj.prev = null

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.invoke() is a child command which operates on an existing subject.  Child commands must be called after a parent command!"
          done()

        @cy.invoke("queue")

      it "throws when first argument isnt a string", (done) ->
        @cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.invoke() only accepts a string as the first argument."
          expect(@log.get("error")).to.eq err
          done()

        @cy.noop({}).invoke({})

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.invoke({})

      it "ensures subject", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Subject is undefined!  You cannot call .its() without a subject."
          done()

        @cy.noop(undefined).its("attr", "src")

      it "onConsole subject", (done) ->
        @cy.on "fail", (err) =>
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "its"
            Error: "CypressError: Timed out retrying: cy.its() errored because the property: 'baz' does not exist on your subject."
            Subject: {foo: "bar"}
          }
          done()

        @cy.noop({foo: "bar"}).its("baz")

  context "#its", ->
    it "proxies to #invoke", ->
      @cy.noop({foo: -> "bar"}).its("foo").should("eq", "bar")

    describe "errors", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(200)

      it "throws when property does not exist on the subject", (done) ->
        @Cypress.on "log", (@log) =>

        @cy.on "fail", (err) =>
          expect(err.message).to.include "cy.its() errored because the property: 'foo' does not exist on your subject."
          expect(@log.get("error")).to.include err
          done()

        @cy.noop({}).its("foo")

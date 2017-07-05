{ $, _, Promise } = window.testUtils

describe "$Cypress.Cy Connectors Commands", ->
  enterCommandTestingMode()

  context "#spread", ->
    it "spreads an array into individual arguments", ->
      @cy.noop([1,2,3]).spread (one, two, three) ->
        expect(one).to.eq(1)
        expect(two).to.eq(2)
        expect(three).to.eq(3)

    it "passes timeout option to spread", ->
      @cy._timeout(50)

      @cy.noop([1,2,3]).spread {timeout: 150}, (one, two, three) ->
        Promise.delay(100)

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when subject isn't an array", (done) ->
        @cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.spread() requires the existing subject be an array."
          done()

        @cy.noop({}).spread ->

      it "throws when promise timeout", (done) ->
        logs = []
        @cy._timeout(50)

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log


        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.spread() timed out after waiting '150ms'."
          done()

        @cy.noop([1,2,3]).spread {timeout: 150}, ->
          new Promise (resolve, reject) ->

  context "#then", ->
    it "converts raw DOM elements", ->
      div = @cy.$$("div:first").get(0)

      cy.wrap(div).then ($div) ->
        expect($div.get(0)).to.eq(div)

    it "mocha inserts 2 arguments to then: anonymous fn for invoking done(), and done reference itself", ->
      ## this puts tests in place to where if mocha
      ## ever updates and changes how it calls .then
      ## on the returned object, we will know

      @cy.then ->
        expect(@cy.queue.length).to.eq 2

        lastThen = @cy.queue.last()

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
        expect(@state("next")).not.to.be.undefined
        done()

      @cy.noop().then((->), fn)

    it "passes timeout option to then", ->
      @cy._timeout(50)

      @cy.then {timeout: 150}, ->
        Promise.delay(100)

    it "can resolve nested thens", ->
      @cy.get("div:first").then ->
        @cy.get("div:first").then ->
          @cy.get("div:first")

    it "can resolve cypress commands inside of a promise", ->
      _then = false

      @cy.then ->

        Promise.delay(10).then =>
          @cy.then ->
            _then = true
      .then ->
        expect(_then).to.be.true

    it "can resolve chained cypress commands inside of a promise", ->
      _then = false

      @cy.then ->

        Promise.delay(10).then =>
          @cy.get("div:first").then ->
            _then = true
      .then ->
        expect(_then).to.be.true

    it "can resolve cypress instance inside of a promise", ->
      @cy.then ->
        Promise.delay(10).then =>
          @cy

    it "passes values to the next command", ->
      @cy
        .wrap({foo: "bar"}).then (obj) ->
          obj.foo
        .then (val) ->
          expect(val).to.eq("bar")

    it "does not throw when returning thenables with cy commands", ->
      @cy
        .wrap({foo: "bar"})
        .then (obj) ->
          new Promise (resolve) =>
            @cy.wait(10)

            resolve(obj.foo)

    it "should pass the eventual resolved thenable value downstream", ->
      @cy
        .wrap({foo: "bar"})
        .then (obj) ->
          @cy
          .wait(10)
          .then ->
            obj.foo
          .then (value) ->
            expect(value).to.eq("bar")

            return value
        .then (val) ->
          expect(val).to.eq("bar")

    it "should not pass the eventual resolve thenable value downstream because thens are not connected", ->
      @cy
        .wrap({foo: "bar"})
        .then (obj) ->
          @cy
          .wait(10)
          .then ->
            obj.foo
          .then (value) ->
            expect(value).to.eq("bar")

            return value
      @cy.then (val) ->
        expect(val).to.be.undefined

    ## FIXME: has this behavior changed on purpose?
    [null, undefined].forEach (val) ->
      it.skip "passes the existing subject if ret is: #{val}", ->
        @cy.wrap({foo: "bar"}).then (obj) ->
          return val
        .then (obj) ->
          expect(obj).to.deep.eq({foo: "bar"})

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when promise timeout", (done) ->
        logs = []
        @cy._timeout(50)

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.then() timed out after waiting '150ms'."
          done()

        @cy.then {timeout: 150}, ->
          new Promise (resolve, reject) ->

      it "throws when mixing up async + sync return values", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(@cy._events.enqueue).to.be.undefined
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.then() failed because you are mixing up async and sync code."
          done()

        @cy.then ->
          expect(@cy._events.enqueue).to.have.length(1)

          @cy.wait(5000)

          return "foo"

      it "unbinds enqueue in the case of an error thrown", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(@cy._events.enqueue).to.be.undefined
          expect(logs.length).to.eq(1)
          done()

        @cy.then ->
          expect(@cy._events.enqueue).to.have.length(1)

          throw new Error("foo")

    describe "yields to remote jQuery subject", ->
      beforeEach ->
        ## set the jquery path back to our
        ## remote window
        @Cypress.option "jQuery", @$iframe.prop("contentWindow").$

        @remoteWindow = @cy.privateState("window")

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
            expectOriginal(@cy.state("subject")).not.to.be.instanceof @remoteWindow.$
            expectOriginal(@cy.state("subject")).to.be.instanceof $

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

      @remoteWindow = @cy.privateState("window")

    afterEach ->
      ## restore back to the global $
      @Cypress.option "jQuery", $

    describe "assertion verification", ->
      beforeEach ->
        delete @remoteWindow.$.fn.foo

        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (attrs, log) =>
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
          expect(@log.get("ended")).to.be.true

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
        @Cypress.on "log", (attrs, @log) =>

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

        @Cypress.on "log", (attrs, log) ->
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
        parent = @cy.$$("input:first").parent()
        expect(parent).to.exist

        @cy.get("input:first").invoke("parent").then ($parent) ->
          expectOriginal($parent).to.be.instanceof @remoteWindow.$
          expect(@cy.state("subject")).to.match parent

    describe "function property", ->
      beforeEach ->
        @obj = {
          foo: -> "foo"
          bar: (num1, num2) -> num1 + num2
          err: -> throw new Error("fn.err failed.")
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

      it "invokes reduced prop", ->
        obj = {
          foo: {
            bar: {
              baz: -> "baz"
            }
          }
        }

        cy.wrap(obj).invoke("foo.bar.baz").should("eq", "baz")

      it "handles properties on the prototype", ->
        num = new Number(10)

        @cy.noop(num).invoke("valueOf").then (num) ->
          expect(num).to.eq 10

      describe "errors", ->
        beforeEach ->
          @allowErrors()
          @currentTest.timeout(200)

        it "bubbles up automatically", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "fn.err failed."
            done()

          @cy.noop(@obj).invoke("err")

        it "throws when prop is not a function", (done) ->
          obj = {
            foo: "foo"
          }

          @Cypress.on "fail", (err) ->
            expect(err.message).to.include("Cannot call cy.invoke() because 'foo' is not a function. You probably want to use cy.its('foo')")
            done()

          @cy.wrap(obj).invoke("foo")

        it "throws when reduced prop is not a function", (done) ->
          obj = {
            foo: {
              bar: "bar"
            }
          }

          @Cypress.on "fail", (err) ->
            expect(err.message).to.include("Cannot call cy.invoke() because 'foo.bar' is not a function. You probably want to use cy.its('foo.bar')")
            done()

          @cy.wrap(obj).invoke("foo.bar")

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
          math: {
            sum: =>
              @obj.sum.apply(@obj, arguments)
          }
        }

        @Cypress.on "log", (attrs, @log) =>

      it "logs $el if subject is element", ->
        @cy.get("button:first").invoke("hide").then ($el) ->
          expect(@log.get("$el").get(0)).to.eq $el.get(0)

      it "does not log $el if subject isnt element", ->
        @cy.noop(@obj).invoke("bar").then ->
          expect(@log.get("$el")).not.to.exist

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
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command:  "invoke"
            Function: ".attr(numbers, [1, 2, 3])"
            "With Arguments": ["numbers", [1,2,3]]
            On:       @obj
            Yielded: {numbers: [1,2,3]}
          }

      it "#consoleProps as a function property without args", ->
        @cy.noop(@obj).invoke("bar").then ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command:  "invoke"
            Function: ".bar()"
            On:       @obj
            Yielded: "bar"
          }

      it "#consoleProps as a function property with args", ->
        @cy.noop(@obj).invoke("sum", 1, 2, 3).then ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command:  "invoke"
            Function: ".sum(1, 2, 3)"
            "With Arguments": [1,2,3]
            On:       @obj
            Yielded: 6
          }

      it "#consoleProps as a function reduced property with args", ->
        @cy.noop(@obj).invoke("math.sum", 1, 2, 3).then ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command:  "invoke"
            Function: ".math.sum(1, 2, 3)"
            "With Arguments": [1,2,3]
            On:       @obj
            Yielded: 6
          }

      it "#consoleProps as a function on DOM element", ->
        @cy.get("button:first").invoke("hide").then ($btn) ->
          consoleProps = @log.attributes.consoleProps()
          expect(consoleProps).to.deep.eq {
            Command: "invoke"
            Function: ".hide()"
            On: $btn.get(0)
            Yielded: $btn.get(0)
          }

    describe "errors", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>
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
          expect(err.message).to.eq "cy.invoke() is a child command which operates on an existing subject.  Child commands must be called after a parent command."
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

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.invoke({})

      it "ensures subject", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Subject is undefined. You cannot call cy.its() without a subject."
          done()

        @cy.noop(undefined).its("attr")

      it "consoleProps subject", (done) ->
        @cy.on "fail", (err) =>
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "its"
            Error: "CypressError: Timed out retrying: cy.its() errored because the property: 'baz' does not exist on your subject."
            Subject: {foo: "bar"}
          }
          done()

        @cy.noop({foo: "bar"}).its("baz")

  context "#its", ->
    beforeEach ->
      ## set the jquery path back to our
      ## remote window
      @Cypress.option "jQuery", @$iframe.prop("contentWindow").$

      @remoteWindow = @cy.privateState("window")

    it "proxies to #invokeFn", ->
      fn = -> "bar"
      @cy.wrap({foo: fn}).its("foo").should("eq", fn)

    it "reduces into dot separated values", ->
      obj = {
        foo: {
          bar: {
            baz: "baz"
          }
        }
      }

      @cy.wrap(obj).its("foo.bar.baz").should("eq", "baz")

    it "does not invoke a function and uses as a property", ->
      fn = -> "fn"
      fn.bar = "bar"

      @cy.wrap(fn).its("bar").should("eq", "bar")

    it "does not invoke a function with multiple its", ->
      fn = -> "fn"
      fn.bar = -> "bar"
      fn.bar.baz = "baz"

      @cy.wrap(fn).its("bar").its("baz").should("eq", "baz")

    it "does not invoke a function and uses as a reduced property", ->
      fn = -> "fn"
      fn.bar = -> "bar"
      fn.bar.baz = "baz"

      obj = {
        foo: fn
      }

      @cy.wrap(obj).its("foo.bar.baz").should("eq", "baz")

    it "returns undefined", ->
      @cy.noop({foo: undefined}).its("foo").then (val) ->
        expect(val).to.be.undefined

    it "returns property", ->
      @cy.noop({baz: "baz"}).its("baz").then (num) ->
        expect(num).to.eq "baz"

    it "returns property on remote subject", ->
      @remoteWindow.$.fn.baz = 123

      @cy.get("div:first").its("baz").then (num) ->
        expect(num).to.eq 123

    it "handles string subjects", ->
      str = "foobarbaz"

      @cy.noop(str).its("length").then (num) ->
        expect(num).to.eq str.length

    it "handles number subjects", ->
      num = 12345

      toFixed = Number.prototype.toFixed

      @cy.wrap(num).its("toFixed").should("eq", toFixed)

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
          baz: ->
        }

        @obj.baz.quux = -> "quux"
        @obj.baz.lorem = "ipsum"

        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "its"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq ".foo"
            done()

        @cy.noop({foo: "foo"}).its("foo")

      it "snapshots after invoking", ->
        @cy.noop({foo: "foo"}).its("foo").then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "ends", ->
        @cy.noop({foo: "foo"}).its("foo").then ->
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

      it "logs obj as a property", ->
        @cy.noop(@obj).its("foo").then ->
          obj = {
            name: "its"
            message: ".foo"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "#consoleProps as a regular property", ->
        @cy.noop(@obj).its("num").then ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command:  "its"
            Property: ".num"
            On:       @obj
            Yielded: 123
          }

    describe "errors", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

        @allowErrors()
        @currentTest.timeout(200)

      it "does not display parenthesis on command", (done) ->
        obj = {
          foo: {
            bar: ->
          }
        }

        obj.foo.bar.baz = => "baz"

        @Cypress.on "fail", (err) =>
          expect(@log.get("error")).to.include(err)
          expect(@log.attributes.consoleProps().Property).to.eq(".foo.bar.baz")
          done()

        @cy.wrap(obj).its("foo.bar.baz").should("eq", "baz")

      it "throws when property does not exist on the subject", (done) ->
        @cy.on "fail", (err) =>
          expect(err.message).to.include "cy.its() errored because the property: 'foo' does not exist on your subject."
          expect(@log.get("error")).to.include err
          done()

        @cy.noop({}).its("foo")

      it "throws when reduced property does not exist on the subject", (done) ->
        @cy.on "fail", (err) =>
          expect(err.message).to.include "cy.its() errored because the property: 'baz' does not exist on your subject."
          expect(@log.get("error")).to.include err
          done()

        obj = {
          foo: {
            bar: {}
          }
        }

        @cy.noop(obj).its("foo.bar.baz")

      [null, undefined].forEach (val) ->
        it "throws on reduced #{val} subject", (done) ->
          @Cypress.on "fail", (err) ->
            expect(err.message).to.include("cy.its() errored because the property: 'foo' returned a '#{val}' value. You cannot access any properties such as 'toString' on a '#{val}' value.")
            done()

          @cy.wrap({foo: val}).its("foo.toString")

      it "throws two args were passed as subject", (done) ->

        @cy.on "fail", (err) =>
          expect(err.message).to.include "cy.its() only accepts a single argument."
          expect(@log.get("error")).to.include err
          done()

        fn = -> "fn"
        fn.bar = -> "bar"
        fn.bar.baz = "baz"

        @cy.wrap(fn).its("bar", "baz").should("eq", "baz")

        ## TODO: currently this doesn't work because
        ## null subjects immediately throw
        # it "throws on initial #{val} subject", ->
        #   @Cypress.on "fail", (err) ->
        #     expect(err.message).to.include("cy.its() errored because the property: 'foo' returned a '#{val}' value. You cannot call any properties such as 'toString' on a '#{val}' value.")
        #     done()

        #   @cy.wrap(val).its("toString")

  context "#each", ->
    it "can each a single element", ->
      count = 0

      @cy.get("#dom").each ->
        count += 1
      .then ->
        expect(count).to.eq(1)

    it "passes the existing subject downstream without side effects", ->
      count = 0

      $lis = @cy.$$("#list li")

      expect($lis).to.have.length(3)

      @cy.get("#list li").each ($li, i, arr) ->
        expect(arr).to.be.instanceof($)
        expect(i).to.eq(count)
        count += 1
        expect(arr.length).to.eq(3)

        cy.wrap($li).should("have.class", "item")
      .then ($lis) ->
        expect(count).to.eq(3)
        expect($lis).to.have.length(3)

    it "awaits promises returned", ->
      count = 0

      start = new Date

      @cy.get("#list li").each ($li, i, arr) ->
        new Promise (resolve, reject) ->
          _.delay ->
            count += 1
            resolve()
          , 20
      .then ($lis) ->
        expect(count).to.eq(3)
        expect(new Date - start).to.be.gt(60)

    it "supports array like structures", ->
      count = 0
      arr = [1,2,3]

      @cy.wrap(arr).each (num, i, a) ->
        expect(a).to.eq(arr)
        expect(i).to.eq(count)
        count += 1
        expect(num).to.eq(count)
      .then (a) ->
        expect(a).to.eq(arr)

    it "ends early when returning false", ->
      arr = [1,2,3]

      ## after 2 calls return false
      ## to end the loop early
      fn = _.after 2, ->
        return false

      fn = @sandbox.spy(fn)

      @cy.wrap(arr).each(fn)
      .then (a) ->
        expect(fn).to.be.calledTwice

    it "works with nested eaches", ->
      count = 0

      @cy.get("#list li").each ($li, i, arr) ->
        cy.wrap($li).parent().siblings("#asdf").find("li").each ($li2, i2, arr2) ->
          count += 1
        .then ($lis) ->
          expect($lis.first()).to.have.text("asdf 1")
          expect($lis).to.have.length(3)
      .then ($lis) ->
        expect($lis).to.have.length(3)
        expect($lis.first()).to.have.text("li 0")
        expect(count).to.eq(9)

    it "can operate on a single element", ->
      count = 0

      @cy.get("div:first").each ($div) ->
        count += 1
      .then ->
        expect(count).to.eq(1)

    describe "errors", ->
      beforeEach ->
        @allowErrors()

        @Cypress.on "log", (attrs, @log) =>
        @currentTest.timeout(200)

      it "can time out", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @Cypress.on "fail", (err) =>
          ## get + each
          expect(logs.length).to.eq(2)
          expect(err.message).to.include("cy.each() timed out after waiting '200ms'.\n\nYour callback function returned a promise which never resolved.")
          done()

        cy.get("ul").each ($ul) ->
          new Promise (resolve) ->

      it "throws when not passed a callback function", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @Cypress.on "fail", (err) =>
          ## get + each
          expect(logs.length).to.eq(2)
          expect(err.message).to.include("cy.each() must be passed a callback function.")
          done()

        cy.get("ul").each({})

      it "throws when not passed a number", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @Cypress.on "fail", (err) =>
          ## get + each
          expect(logs.length).to.eq(2)
          expect(err.message).to.include("cy.each() can only operate on an array like subject. Your subject was: '100'")
          done()

        cy.wrap(100).each ->

      it "throws when not passed an array like structure", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @Cypress.on "fail", (err) =>
          ## get + each
          expect(logs.length).to.eq(2)
          expect(err.message).to.include("cy.each() can only operate on an array like subject. Your subject was: '{}'")
          done()

        cy.wrap({}).each ->

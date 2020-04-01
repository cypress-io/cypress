$ = Cypress.$.bind(Cypress)
_ = Cypress._
Promise = Cypress.Promise

describe "src/cy/commands/connectors", ->
  describe "with jquery", ->
    before ->
      cy
        .visit("/fixtures/jquery.html")
        .then (win) ->
          @body = win.document.body.outerHTML

    beforeEach ->
      doc = cy.state("document")

      $(doc.body).empty().html(@body)

    context "#spread", ->
      it "spreads an array into individual arguments", ->
        cy.noop([1,2,3]).spread (one, two, three) ->
          expect(one).to.eq(1)
          expect(two).to.eq(2)
          expect(three).to.eq(3)

      it "spreads a jQuery wrapper into individual arguments", ->
        cy.noop($("div")).spread (first, second) ->
          expect(first.tagName).to.eq('DIV')
          expect(first.innerText).to.eq("div")
          expect(second.tagName).to.eq('DIV')
          expect(second.innerText).to.contain("Nested Find")

      it "passes timeout option to spread", ->
        cy.timeout(50)

        cy.noop([1,2,3]).spread {timeout: 150}, (one, two, three) ->
          Promise.delay(100)

      describe "errors", ->
        beforeEach ->
          Cypress.config("defaultCommandTimeout", 50)

        it "throws when subject isn't array-like", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.eq "`cy.spread()` requires the existing subject be array-like."
            expect(err.docsUrl).to.eq("https://on.cypress.io/spread")
            done()

          cy.noop({}).spread ->

        it "throws when promise timeout", (done) ->
          logs = []

          cy.on "log:added", (attrs, log) =>
            logs?.push(log)

          cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(logs[0].get("error")).to.eq(err)
            expect(err.message).to.include "`cy.spread()` timed out after waiting `20ms`."
            done()

          cy.noop([1,2,3]).spread {timeout: 20}, ->
            new Promise (resolve, reject) ->

    context "#then", ->
      it "converts raw DOM elements", ->
        div = cy.$$("div:first").get(0)

        cy.wrap(div).then ($div) ->
          expect($div.get(0)).to.eq(div)

      it "does not insert a mocha callback", ->
        cy.noop().then ->
          expect(cy.queue.length).to.eq(2)

      it "passes timeout option to then", ->
        cy.timeout(50)

        cy.then {timeout: 150}, ->
          Promise.delay(100)

      it "can resolve nested thens", ->
        cy.get("div:first").then ->
          cy.get("div:first").then ->
            cy.get("div:first")

      it "can resolve cypress commands inside of a promise", ->
        _then = false

        cy.wrap(null).then ->
          Promise.delay(10).then ->
            cy.then ->
              _then = true
        .then ->
          expect(_then).to.be.true

      it "can resolve chained cypress commands inside of a promise", ->
        _then = false

        cy.wrap(null).then ->
          Promise.delay(10).then ->
            cy.get("div:first").then ->
              _then = true
        .then ->
          expect(_then).to.be.true

      it "can resolve cypress instance inside of a promise", ->
        cy.then ->
          Promise.delay(10).then =>
            cy

      it "passes values to the next command", ->
        cy
          .wrap({foo: "bar"}).then (obj) ->
            obj.foo
          .then (val) ->
            expect(val).to.eq("bar")

      it "does not throw when returning thenables with cy commands", ->
        cy
          .wrap({foo: "bar"})
          .then (obj) ->
            new Promise (resolve) =>
              cy.wait(10)

              resolve(obj.foo)

      it "should pass the eventual resolved thenable value downstream", ->
        cy
          .wrap({foo: "bar"})
          .then (obj) ->
            cy
            .wait(10)
            .then ->
              obj.foo
            .then (value) ->
              expect(value).to.eq("bar")

              return value
          .then (val) ->
            expect(val).to.eq("bar")

      it "should not pass the eventual resolve thenable value downstream because thens are not connected", ->
        cy
          .wrap({foo: "bar"})
          .then (obj) ->
            cy
            .wait(10)
            .then ->
              obj.foo
            .then (value) ->
              expect(value).to.eq("bar")

              return value
        cy.then (val) ->
          expect(val).to.be.undefined

      it "passes the existing subject if ret is undefined", ->
        cy.wrap({foo: "bar"}).then (obj) ->
          return undefined
        .then (obj) ->
          expect(obj).to.deep.eq({foo: "bar"})

      it "sets the subject to null when given null", ->
        cy.wrap({foo: "bar"}).then (obj) ->
          return null
        .then (obj) ->
          expect(obj).to.be.null

      describe "errors", ->
        beforeEach ->
          Cypress.config("defaultCommandTimeout", 50)

          @logs = []

          cy.on "log:added", (attrs, log) =>
            @lastLog = log
            @logs?.push(log)

          return null

        it "throws when promise timeout", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(@logs.length).to.eq(1)
            expect(lastLog.get("error")).to.eq(err)
            expect(err.message).to.include "`cy.then()` timed out after waiting `150ms`."
            done()

          cy.then {timeout: 150}, ->
            new Promise (resolve, reject) ->

        it "throws when mixing up async + sync return values", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(@logs.length).to.eq(1)
            expect(lastLog.get("error")).to.eq(err)
            expect(err.message).to.include "`cy.then()` failed because you are mixing up async and sync code."
            done()

          cy.then ->
            cy.wait(5000)

            return "foo"

        it "unbinds command:enqueued in the case of an error thrown", (done) ->
          listeners = []

          cy.on "fail", (err) =>
            listeners.push(cy.listeners("command:enqueued").length)

            expect(@logs.length).to.eq(1)
            expect(listeners).to.deep.eq([1, 0])
            done()

          cy.then ->
            listeners.push(cy.listeners("command:enqueued").length)

            throw new Error("foo")

      describe "yields to remote jQuery subject", ->
        beforeEach ->
          @remoteWindow = cy.state("window")

        it "calls the callback function with the remote jQuery subject", ->
          @remoteWindow.$.fn.foo = fn = ->

          cy
            .get("div:first").then ($div) ->
              expect($div).to.be.instanceof(@remoteWindow.$)
              return $div
            .then ($div) ->
              expect($div).to.be.instanceof(@remoteWindow.$)

        it "does not store the remote jquery object as the subject", ->
          cy
            .get("div:first").then ($div) ->
              expect($div).to.be.instanceof(@remoteWindow.$)
              return $div
            .then ($div) ->
              expect(cy.state("subject")).not.to.be.instanceof(@remoteWindow.$)

    context "#invoke", ->
      beforeEach ->
        @remoteWindow = cy.state("window")

      describe "assertion verification", ->
        beforeEach ->
          delete @remoteWindow.$.fn.foo

          Cypress.config("defaultCommandTimeout", 100)

          @logs = []

          cy.on "log:added", (attrs, log) =>
            @lastLog = log
            @logs?.push(log)

          return null

        it "eventually passes the assertion", ->
          cy.on "command:retry", _.after 2, =>
            @remoteWindow.$.fn.foo = -> "foo"

          cy.get("div:first").invoke("foo").should("eq", "foo").then ->
            lastLog = @lastLog

            expect(lastLog.get("name")).to.eq("assert")
            expect(lastLog.get("state")).to.eq("passed")
            expect(lastLog.get("ended")).to.be.true

        it "eventually fails the assertion", (done) ->
          cy.on "command:retry", _.after 2, =>
            @remoteWindow.$.fn.foo = -> "foo"

          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include(lastLog.get("error").message)
            expect(err.message).not.to.include("undefined")
            expect(lastLog.get("name")).to.eq("assert")
            expect(lastLog.get("state")).to.eq("failed")
            expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

            done()

          cy.get("div:first").invoke("foo").should("eq", "bar")

        it "can still fail on invoke", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include(lastLog.get("error").message)
            expect(err.message).not.to.include("undefined")
            expect(lastLog.get("name")).to.eq("invoke")
            expect(lastLog.get("state")).to.eq("failed")

            done()

          cy.get("div:first").invoke("foobarbaz")

        it "does not log an additional log on failure", (done) ->
          @remoteWindow.$.fn.foo = -> "foo"

          cy.on "fail", =>
            expect(@logs.length).to.eq(3)
            done()

          cy.get("div:first").invoke("foo").should("eq", "bar")

      describe "remote DOM subjects", ->
        it "is invoked on the remote DOM subject", ->
          @remoteWindow.$.fn.foo = -> "foo"

          cy.get("div:first").invoke("foo").then (str) ->
            expect(str).to.eq "foo"

        it "re-wraps the remote element if its returned", ->
          parent = cy.$$("div:first").parent()
          expect(parent).to.exist

          cy.get("div:first").invoke("parent").then ($parent) ->
            expect($parent).to.be.instanceof @remoteWindow.$
            expect(cy.state("subject")).to.match parent

      describe "function property", ->
        beforeEach ->
          @obj = {
            foo: -> "foo"
            bar: (num1, num2) -> num1 + num2
            err: -> throw new Error("fn.err failed.")
            baz: 10
          }

        it "changes subject to function invocation", ->
          cy.noop(@obj).invoke("foo").then (str) ->
            expect(str).to.eq "foo"

        it "works with numerical indexes", ->
          i = 0
          fn = ->
            i++
            return i == 5

          cy.noop([_.noop, fn]).invoke(1).should('be.true')

        it "works with 0 as a value if object has property 0", ->
          i = 0
          fn = ->
            if i++ is 0 then "cy.noop is undocumented"
            else "and I don't understand what it is"

          cy.wrap([fn, "bar"]).invoke(0).should("eq", "cy.noop is undocumented")
          cy.wrap({"0": fn}).invoke(0).should("eq", "and I don't understand what it is")


        it "forwards any additional arguments", ->
          cy.noop(@obj).invoke("bar", 1, 2).then (num) ->
            expect(num).to.eq 3


          obj = {
            bar: -> undefined
          }

          cy.noop(obj).invoke("bar").then (val) ->
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

          cy.noop(num).invoke("valueOf").then (num) ->
            expect(num).to.eq 10

        it "retries until function exists on the subject", ->
          obj = {}

          cy.on "command:retry", _.after 3, ->
            obj.foo = -> "bar"

          cy.wrap(obj).invoke("foo").then (val) ->
            expect(val).to.eq("bar")

        it "retries until property is a function", ->
          obj = {
            foo: ""
          }

          cy.on "command:retry", _.after 3, ->
            obj.foo = -> "bar"

          cy.wrap(obj).invoke("foo").then (val) ->
            expect(val).to.eq("bar")

        it "retries until property is a function when initially undefined", ->
          obj = {
            foo: undefined
          }

          cy.on "command:retry", _.after 3, ->
            obj.foo = -> "bar"

          cy.wrap(obj).invoke("foo").then (val) ->
            expect(val).to.eq("bar")

        it "retries until value matches assertions", ->
          obj = {
            foo: -> "foo"
          }

          cy.on "command:retry", _.after 3, ->
            obj.foo = -> "bar"

          cy.wrap(obj).invoke("foo").should("eq", "bar")

        [null, undefined].forEach (val) ->
          it "changes subject to '#{val}' without throwing default assertion existence", ->
            obj = {
              foo: -> val
            }

            cy.wrap(obj).invoke("foo").then (val2) ->
              expect(val2).to.eq(val)

        describe "errors", ->
          beforeEach ->
            Cypress.config("defaultCommandTimeout", 50)

          it "bubbles up automatically", (done) ->
            cy.on "fail", (err) ->
              expect(err.message).to.include "fn.err failed."
              done()

            cy.noop(@obj).invoke("err")

          it "throws when prop is not a function", (done) ->
            obj = {
              foo: /re/
            }

            cy.on "fail", (err) ->
              expect(err.message).to.include("Timed out retrying: `cy.invoke()` errored because the property: `foo` returned a `regexp` value instead of a function. `cy.invoke()` can only be used on properties that return callable functions.")
              expect(err.message).to.include("`cy.invoke()` waited for the specified property `foo` to return a function, but it never did.")
              expect(err.message).to.include("If you want to assert on the property's value, then switch to use `cy.its()` and add an assertion such as:")
              expect(err.message).to.include("`cy.wrap({ foo: 'bar' }).its('foo').should('eq', 'bar')`")
              expect(err.docsUrl).to.eq("https://on.cypress.io/invoke")

              done()

            cy.wrap(obj).invoke("foo")

          it "throws when reduced prop is not a function", (done) ->
            obj = {
              foo: {
                bar: "bar"
              }
            }

            cy.on "fail", (err) ->
              expect(err.message).to.include("Timed out retrying: `cy.invoke()` errored because the property: `bar` returned a `string` value instead of a function. `cy.invoke()` can only be used on properties that return callable functions.")
              expect(err.message).to.include("`cy.invoke()` waited for the specified property `bar` to return a function, but it never did.")
              expect(err.message).to.include("If you want to assert on the property's value, then switch to use `cy.its()` and add an assertion such as:")
              expect(err.message).to.include("`cy.wrap({ foo: 'bar' }).its('foo').should('eq', 'bar')`")
              expect(err.docsUrl).to.eq("https://on.cypress.io/invoke")

              done()

            cy.wrap(obj).invoke("foo.bar")

      describe "accepts a options argument", ->

        it "changes subject to function invocation", ->
          cy.noop({ foo: -> "foo" }).invoke({ log: false }, "foo").then (str) ->
            expect(str).to.eq "foo"

        it "forwards any additional arguments", ->
          cy.noop({ bar: (num1, num2) -> num1 + num2 }).invoke({ log: false }, "bar", 1, 2).then (num) ->
            expect(num).to.eq 3

          cy.noop({ bar: -> undefined }).invoke({ log: false }, "bar").then (val) ->
            expect(val).to.be.undefined

        it "works with numerical indexes", ->
          i = 0
          fn = ->
            i++
            return i == 5

          cy.noop([_.noop, fn]).invoke({}, 1).should('be.true')

        describe "errors", ->
          beforeEach ->
            Cypress.config("defaultCommandTimeout", 50)

            cy.on "log:added", (attrs, log) =>
              @lastLog = log

            return null

          it "throws when function name is missing", (done) ->
            cy.on "fail", (err) =>
                lastLog = @lastLog
                expect(err.message).to.include "`cy.invoke()` expects the functionName argument to have a value"
                expect(lastLog.get("error").message).to.include(err.message)
                done()

            cy.wrap({ foo: -> "foo"}).invoke({})

          it "throws when function name is not of type string but of type boolean", (done) ->
            cy.on "fail", (err) =>
                lastLog = @lastLog
                expect(err.message).to.include "`cy.invoke()` only accepts a string or a number as the functionName argument."
                expect(lastLog.get("error").message).to.include(err.message)
                done()

            cy.wrap({ foo: -> "foo"}).invoke({}, true)

          it "throws when function name is not of type string but of type function", (done) ->
            cy.on "fail", (err) =>
                lastLog = @lastLog
                expect(err.message).to.include "`cy.invoke()` only accepts a string or a number as the functionName argument."
                expect(lastLog.get("error").message).to.include(err.message)
                done()

            cy.wrap({ foo: -> "foo"}).invoke(() -> {})

          it "throws when first parameter is neither of type object nor of type string nor of type number", (done) ->
            cy.on "fail", (err) =>
                lastLog = @lastLog
                expect(err.message).to.include "`cy.invoke()` only accepts a string or a number as the functionName argument."
                expect(lastLog.get("error").message).to.include(err.message)
                done()

            cy.wrap({ foo: -> "foo"}).invoke(true, "show")

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
              sum: (a, b) -> a + b
            }

            cy.on "log:added", (attrs, log) =>
              @lastLog = log

            return null

          it "logs obj as a function", ->
            cy.noop(@obj).invoke({ log: true }, "bar").then ->
              obj = {
                name: "invoke"
                message: ".bar()"
              }

              lastLog = @lastLog

              _.each obj, (value, key) =>
                expect(lastLog.get(key)).to.deep.eq value

          it "logs obj with arguments", ->
            cy.noop(@obj).invoke({ log: true }, "attr", "numbers", [1,2,3]).then ->
              expect(@lastLog.invoke("consoleProps")).to.deep.eq {
                Command:  "invoke"
                Function: ".attr(numbers, [1, 2, 3])"
                "With Arguments": ["numbers", [1,2,3]]
                Subject: @obj
                Yielded: {numbers: [1,2,3]}
              }

          it "can be disabled", ->
            cy.noop(@obj).invoke({ log: true }, "sum", 1, 2).then ->
              expect(@lastLog.invoke("consoleProps")).to.have.property("Function", ".sum(1, 2)")
              @lastLog = undefined

            cy.noop(@obj).invoke({ log: false }, "sum", 1, 2).then ->
              expect(@lastLog).to.be.undefined

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
              sum: (args...) =>
                @obj.sum(args...)
            }
          }

          @logs = []

          cy.on "log:added", (attrs, log) =>
            @lastLog = log
            @logs?.push(log)

          return null

        it "logs $el if subject is element", ->
          cy.get("div:first").invoke("hide").then ($el) ->
            lastLog = @lastLog

            expect(lastLog.get("$el").get(0)).to.eq $el.get(0)

        it "does not log $el if subject isnt element", ->
          cy.noop(@obj).invoke("bar").then ->
            lastLog = @lastLog

            expect(lastLog.get("$el")).not.to.exist

        it "logs obj as a function", ->
          cy.noop(@obj).invoke("bar").then ->
            obj = {
              name: "invoke"
              message: ".bar()"
            }

            lastLog = @lastLog

            _.each obj, (value, key) =>
              expect(lastLog.get(key)).to.deep.eq value

        it "logs obj with arguments", ->
          cy.noop(@obj).invoke("attr", "numbers", [1,2,3]).then ->
            expect(@lastLog.invoke("consoleProps")).to.deep.eq {
              Command:  "invoke"
              Function: ".attr(numbers, [1, 2, 3])"
              "With Arguments": ["numbers", [1,2,3]]
              Subject: @obj
              Yielded: {numbers: [1,2,3]}
            }

        it "#consoleProps as a function property without args", ->
          cy.noop(@obj).invoke("bar").then ->
            expect(@lastLog.invoke("consoleProps")).to.deep.eq {
              Command:  "invoke"
              Function: ".bar()"
              Subject: @obj
              Yielded: "bar"
            }

        it "#consoleProps as a function property with args", ->
          cy.noop(@obj).invoke("sum", 1, 2, 3).then ->
            expect(@lastLog.invoke("consoleProps")).to.deep.eq {
              Command:  "invoke"
              Function: ".sum(1, 2, 3)"
              "With Arguments": [1,2,3]
              Subject: @obj
              Yielded: 6
            }

        it "#consoleProps as a function reduced property with args", ->
          cy.noop(@obj).invoke("math.sum", 1, 2, 3).then ->
            expect(@lastLog.invoke("consoleProps")).to.deep.eq {
              Command:  "invoke"
              Function: ".math.sum(1, 2, 3)"
              "With Arguments": [1,2,3]
              Subject: @obj
              Yielded: 6
            }

        it "#consoleProps as a function on DOM element", ->
          cy.get("div:first").invoke("hide").then ($btn) ->
            consoleProps = @lastLog.invoke("consoleProps")
            expect(consoleProps).to.deep.eq {
              Command: "invoke"
              Function: ".hide()"
              Subject: $btn.get(0)
              Yielded: $btn.get(0)
            }

      describe "errors", ->
        beforeEach ->
          Cypress.config("defaultCommandTimeout", 50)

          @logs = []

          cy.on "log:added", (attrs, log) =>
            @lastLog = log
            @logs?.push(log)

          return null

        it "throws when property does not exist on the subject", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include "Timed out retrying: `cy.invoke()` errored because the property: `foo` does not exist on your subject."
            expect(err.message).to.include "`cy.invoke()` waited for the specified property `foo` to exist, but it never did."
            expect(err.message).to.include "If you do not expect the property `foo` to exist, then add an assertion such as:"
            expect(err.message).to.include "`cy.wrap({ foo: 'bar' }).its('quux').should('not.exist')`"
            expect(lastLog.get("error").message).to.include(err.message)
            expect(err.docsUrl).to.eq("https://on.cypress.io/invoke")

            done()

          cy.wrap({}).invoke("foo")

        it "throws without a subject", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include("cy.invoke(\"queue\")")
            expect(err.message).to.include("child command before running a parent command")
            done()

          cy.invoke("queue")

        it "logs once when not dom subject", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(@logs.length).to.eq(1)
            expect(lastLog.get("error")).to.eq(err)
            done()

          cy.invoke({})

        it "throws when failing assertions", (done) ->
          obj = {
            foo: -> "foo"
          }

          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.eq("Timed out retrying: expected 'foo' to equal 'bar'")

            expect(lastLog.get("error").message).to.eq("Timed out retrying: expected 'foo' to equal 'bar'")

            done()

          cy.wrap(obj).invoke("foo").should("eq", "bar")

        it "throws when initial subject is undefined", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include("Timed out retrying: `cy.invoke()` errored because your subject is: `undefined`. You cannot invoke any functions such as `foo` on a `undefined` value.")
            expect(err.message).to.include("If you expect your subject to be `undefined`, then add an assertion such as:")
            expect(err.message).to.include("`cy.wrap(undefined).should('be.undefined')`")
            expect(err.docsUrl).to.eq("https://on.cypress.io/invoke")
            expect(lastLog.get("error").message).to.include(err.message)

            done()

          cy.wrap(undefined).invoke("foo")

        it "throws when property value is undefined", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include "Timed out retrying: `cy.invoke()` errored because the property: `foo` is not a function, and instead returned a `undefined` value."
            expect(err.message).to.include "`cy.invoke()` waited for the specified property `foo` to become a callable function, but it never did."
            expect(err.message).to.include "If you expect the property `foo` to be `undefined`, then switch to use `cy.its()` and add an assertion such as:"
            expect(err.message).to.include "`cy.wrap({ foo: undefined }).its('foo').should('be.undefined')`"
            expect(lastLog.get("error").message).to.include(err.message)
            expect(err.docsUrl).to.eq("https://on.cypress.io/invoke")

            done()

          cy.wrap({ foo: undefined }).invoke("foo")

        it "throws when nested property value is undefined", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include("Timed out retrying: `cy.invoke()` errored because the property: `baz` does not exist on your subject.")
            expect(lastLog.get("error").message).to.include(err.message)
            expect(err.docsUrl).to.eq("https://on.cypress.io/invoke")
            done()

          obj = {
            foo: {
              bar: {}
            }
          }

          cy.wrap(obj).invoke("foo.bar.baz.fizz")

    context "#its", ->
      beforeEach ->
        @remoteWindow = cy.state("window")

      it "proxies to #invokeFn", ->
        fn = -> "bar"
        cy.wrap({foo: fn}).its("foo").should("eq", fn)

      it "works with numerical indexes", ->
        cy.wrap(['foo', 'bar']).its(1).should('eq', 'bar')

      it "works with 0 as a value if object has property 0", ->
        cy.wrap(["foo", "bar"]).its(0).should("eq", "foo")
        cy.wrap({"0": "whoa"}).its(0).should("eq", "whoa")
        cy.wrap([###empty###, "spooky"]).its(0).should("not.exist")

      it "reduces into dot separated values", ->
        obj = {
          foo: {
            bar: {
              baz: "baz"
            }
          }
        }

        cy.wrap(obj).its("foo.bar.baz").should("eq", "baz")

      it "does not invoke a function and uses as a property", ->
        fn = -> "fn"
        fn.bar = "bar"

        cy.wrap(fn).its("bar").should("eq", "bar")

      it "does not invoke a function with multiple its", ->
        fn = -> "fn"
        fn.bar = -> "bar"
        fn.bar.baz = "baz"

        cy.wrap(fn).its("bar").its("baz").should("eq", "baz")

      it "does not invoke a function and uses as a reduced property", ->
        fn = -> "fn"
        fn.bar = -> "bar"
        fn.bar.baz = "baz"

        obj = {
          foo: fn
        }

        cy.wrap(obj).its("foo.bar.baz").should("eq", "baz")

      it "does not invoke a function and can assert it throws", ->
        err = new Error("nope cant access me")

        obj = {
          foo:  -> throw err
        }

        cy.wrap(obj).its("foo").should("throw", "nope cant access me")

      it "returns property", ->
        cy.noop({baz: "baz"}).its("baz").then (num) ->
          expect(num).to.eq "baz"

      it "returns property on remote subject", ->
        @remoteWindow.$.fn.baz = 123

        cy.get("div:first").its("baz").then (num) ->
          expect(num).to.eq 123

      it "handles string subjects", ->
        str = "foobarbaz"

        cy.noop(str).its("length").then (num) ->
          expect(num).to.eq str.length

      it "handles number subjects", ->
        num = 12345

        toFixed = top.Number.prototype.toFixed

        cy.wrap(num).its("toFixed").should("eq", toFixed)

      it "retries by default until property exists without an assertion", ->
        obj = {}

        cy.on "command:retry", _.after 3, ->
          obj.foo = "bar"

        cy.wrap(obj).its("foo").then (val) ->
          expect(val).to.eq("bar")

      it "retries until property is not undefined without an assertion", ->
        obj = {
          foo: undefined
        }

        cy.on "command:retry", _.after 3, ->
          obj.foo = "bar"

        cy.wrap(obj).its("foo").then (val) ->
          expect(val).to.eq("bar")

      it "retries until property is not null without an assertion", ->
        obj = {
          foo: null
        }

        cy.on "command:retry", _.after 3, ->
          obj.foo = "bar"

        cy.wrap(obj).its("foo").then (val) ->
          expect(val).to.eq("bar")

      it "retries when yielded undefined value and using assertion", ->
        obj = { foo: '' }

        cy.stub(obj, 'foo').get(
          cy.stub()
            .onCall(0).returns(undefined)
            .onCall(1).returns(undefined)
            .onCall(2).returns(true)
        )
        cy.wrap(obj).its('foo').should('eq', true)

      it "retries until property does NOT exist with an assertion", ->
        obj = {
          foo: ""
        }

        cy.on "command:retry", _.after 3, ->
          delete obj.foo

        cy.wrap(obj).its("foo").should("not.exist").then (val) ->
          expect(val).to.be.undefined

      it "passes when property does not exist on the subject with assertions", ->
        cy.wrap({}).its("foo").should("not.exist")
        cy.wrap({}).its("foo").should("be.undefined")
        cy.wrap({}).its("foo").should("not.be.ok")

        ## TODO: should these really pass here?
        ## isn't this the same situation as: cy.should('not.have.class', '...')
        ##
        ## when we use the 'eq' and 'not.eq' chainer aren't we effectively
        ## saying that it must *have* a value as opposed to the property not
        ## existing at all?
        ##
        ## does a tree falling in the forest really make a sound?
        cy.wrap({}).its("foo").should("eq", undefined)
        cy.wrap({}).its("foo").should("not.eq", "bar")

      it "passes when nested property does not exist on the subject with assertions", ->
        obj = {
          foo: {}
        }

        cy.wrap(obj).its("foo").should("not.have.property", "bar")
        cy.wrap(obj).its("foo.bar").should("not.exist")
        cy.wrap(obj).its("foo.bar.baz").should("not.exist")

      it "passes when property value is null with assertions", ->
        obj = {
          foo: null
        }

        cy.wrap(obj).its("foo").should("be.null")
        cy.wrap(obj).its("foo").should("eq", null)

      it "passes when property value is undefined with assertions", ->
        obj = {
          foo: undefined
        }

        cy.wrap(obj).its("foo").should("be.undefined")
        cy.wrap(obj).its("foo").should("eq", undefined)

      describe "accepts a options argument and works as without options argument", ->

        it "proxies to #invokeFn", ->
          fn = -> "bar"
          cy.wrap({foo: fn}).its("foo", { log: false }).should("eq", fn)

        it "does not invoke a function and uses as a property", ->
          fn = -> "fn"
          fn.bar = "bar"

          cy.wrap(fn).its("bar", { log: false }).should("eq", "bar")

        it "works with numerical indexes", ->
          cy.wrap(['foo', 'bar']).its(1, {}).should('eq', 'bar')

        describe ".log", ->
          beforeEach ->
            @obj = {
              foo: "foo bar baz"
              num: 123
            }

            cy.on "log:added", (attrs, log) =>
              @lastLog = log

            return null

          it "logs obj as a property", ->
            cy.noop(@obj).its("foo", { log: true }).then ->
              obj = {
                name: "its"
                message: ".foo"
              }

              lastLog = @lastLog

              _.each obj, (value, key) =>
                expect(lastLog.get(key)).to.deep.eq value

          it "#consoleProps as a regular property", ->
            cy.noop(@obj).its("num", { log: true }).then ->
              expect(@lastLog.invoke("consoleProps")).to.deep.eq {
                Command:  "its"
                Property: ".num"
                Subject:       @obj
                Yielded: 123
              }

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

          @logs = []

          cy.on "log:added", (attrs, log) =>
            @lastLog = log
            @logs?.push(log)

          return null

        it "logs immediately before resolving", (done) ->
          cy.on "log:added", (attrs, log) ->
            if log.get("name") is "its"
              expect(log.get("state")).to.eq("pending")
              expect(log.get("message")).to.eq ".foo"
              done()

          cy.noop({foo: "foo"}).its("foo")

        it "snapshots after invoking", ->
          cy.noop({foo: "foo"}).its("foo").then ->
            lastLog = @lastLog

            expect(lastLog.get("snapshots").length).to.eq(1)
            expect(lastLog.get("snapshots")[0]).to.be.an("object")

        it "ends", ->
          cy.noop({foo: "foo"}).its("foo").then ->
            lastLog = @lastLog

            expect(lastLog.get("state")).to.eq("passed")
            expect(lastLog.get("ended")).to.be.true

        it "logs obj as a property", ->
          cy.noop(@obj).its("foo").then ->
            obj = {
              name: "its"
              message: ".foo"
            }

            lastLog = @lastLog

            _.each obj, (value, key) =>
              expect(lastLog.get(key)).to.deep.eq value

        it "#consoleProps as a regular property", ->
          cy.noop(@obj).its("num").then ->
            expect(@lastLog.invoke("consoleProps")).to.deep.eq {
              Command:  "its"
              Property: ".num"
              Subject:       @obj
              Yielded: 123
            }

        it "can be disabled", ->
          cy.noop(@obj).its("num", { log: true }).then ->
            expect(@lastLog.invoke("consoleProps")).to.have.property("Property", ".num")
            @lastLog = undefined

          cy.noop(@obj).its("num", { log: false }).then ->
            expect(@lastLog).to.be.undefined

      describe "errors", ->
        beforeEach ->
          Cypress.config("defaultCommandTimeout", 50)

          @logs = []

          cy.on "log:added", (attrs, log) =>
            if attrs.name is "its"
              @lastLog = log

            @logs?.push(log)

          return null

        it "throws without a subject", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include("cy.its(\"wat\")")
            expect(err.message).to.include("child command before running a parent command")
            done()

          cy.its("wat")

        it "throws when property does not exist", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include "Timed out retrying: `cy.its()` errored because the property: `foo` does not exist on your subject."
            expect(err.message).to.include "`cy.its()` waited for the specified property `foo` to exist, but it never did."
            expect(err.message).to.include "If you do not expect the property `foo` to exist, then add an assertion such as:"
            expect(err.message).to.include "`cy.wrap({ foo: 'bar' }).its('quux').should('not.exist')`"
            expect(err.docsUrl).to.eq("https://on.cypress.io/its")
            expect(lastLog.get("error").message).to.include(err.message)

            done()

          cy.wrap({}).its("foo")

        it "throws when property is undefined", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include "Timed out retrying: `cy.its()` errored because the property: `foo` returned a `undefined` value."
            expect(err.message).to.include "`cy.its()` waited for the specified property `foo` to become accessible, but it never did."
            expect(err.message).to.include "If you expect the property `foo` to be `undefined`, then add an assertion such as:"
            expect(err.message).to.include "`cy.wrap({ foo: undefined }).its('foo').should('be.undefined')`"
            expect(err.docsUrl).to.eq("https://on.cypress.io/its")
            expect(lastLog.get("error").message).to.include(err.message)

            done()

          cy.wrap({ foo: undefined }).its("foo")

        it "throws when property is null", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include "Timed out retrying: `cy.its()` errored because the property: `foo` returned a `null` value."
            expect(err.message).to.include "`cy.its()` waited for the specified property `foo` to become accessible, but it never did."
            expect(err.message).to.include "If you expect the property `foo` to be `null`, then add an assertion such as:"
            expect(err.message).to.include "`cy.wrap({ foo: null }).its('foo').should('be.null')`"
            expect(err.docsUrl).to.eq("https://on.cypress.io/its")
            expect(lastLog.get("error").message).to.include(err.message)

            done()

          cy.wrap({ foo: null }).its("foo")

        it "throws the traversalErr as precedence when property does not exist even if the additional assertions fail", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include "Timed out retrying: `cy.its()` errored because the property: `b` does not exist on your subject."
            expect(err.message).to.include "`cy.its()` waited for the specified property `b` to exist, but it never did."
            expect(err.message).to.include "If you do not expect the property `b` to exist, then add an assertion such as:"
            expect(err.message).to.include "`cy.wrap({ foo: 'bar' }).its('quux').should('not.exist')`"

            expect(lastLog.get("error").message).to.include(err.message)

            done()

          cy.wrap({ a: "a" }).its("b").should("be.true")

        it "throws the traversalErr as precedence when property value is undefined even if the additional assertions fail", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include "Timed out retrying: `cy.its()` errored because the property: `a` returned a `undefined` value."
            expect(err.message).to.include "`cy.its()` waited for the specified property `a` to become accessible, but it never did."
            expect(err.message).to.include "If you expect the property `a` to be `undefined`, then add an assertion such as:"
            expect(err.message).to.include "`cy.wrap({ foo: undefined }).its('foo').should('be.undefined')`"
            expect(err.docsUrl).to.eq("https://on.cypress.io/its")
            expect(lastLog.get("error").message).to.include(err.message)

            done()

          cy.wrap({ a: undefined }).its("a").should("be.true")

        it "does not display parenthesis on command", (done) ->
          obj = {
            foo: {
              bar: ->
            }
          }

          obj.foo.bar.baz = => "baz"

          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(lastLog.get("error").message).to.include(err.message)
            expect(lastLog.invoke("consoleProps").Property).to.eq(".foo.bar.baz")
            done()

          cy.wrap(obj).its("foo.bar.baz").should("eq", "baz")

        it "can handle getter that throws", (done) ->
          spy = cy.spy((err)=>
            expect(err.message).to.eq('Timed out retrying: some getter error')
            done()
          ).as('onFail')

          cy.on 'fail', spy

          obj = {}

          Object.defineProperty obj, 'foo', {
            get: -> throw new Error('some getter error')
          }

          cy.wrap(obj).its('foo')

        it "throws when reduced property does not exist on the subject", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include("Timed out retrying: `cy.its()` errored because the property: `baz` does not exist on your subject.")
            expect(err.docsUrl).to.eq("https://on.cypress.io/its")
            expect(lastLog.get("error").message).to.include(err.message)
            expect(lastLog.get("error").message).to.include(err.message)
            done()

          obj = {
            foo: {
              bar: {}
            }
          }

          cy.wrap(obj).its("foo.bar.baz.fizz")

        [null, undefined].forEach (val) ->
          it "throws on traversed '#{val}' subject", (done) ->
            cy.on "fail", (err) ->
              expect(err.message).to.include("Timed out retrying: `cy.its()` errored because the property: `a` returned a `#{val}` value. The property: `b` does not exist on a `#{val}` value.")
              expect(err.message).to.include("`cy.its()` waited for the specified property `b` to become accessible, but it never did.")
              expect(err.message).to.include("If you do not expect the property `b` to exist, then add an assertion such as:")
              expect(err.message).to.include("`cy.wrap({ foo: #{val} }).its('foo.baz').should('not.exist')`")
              expect(err.docsUrl).to.eq("https://on.cypress.io/its")
              done()

            cy.wrap({ a: val }).its("a.b.c")

          it "throws on initial '#{val}' subject", (done) ->
            cy.on "fail", (err) ->
              expect(err.message).to.include("Timed out retrying: `cy.its()` errored because your subject is: `#{val}`. You cannot access any properties such as `foo` on a `#{val}` value.")
              expect(err.message).to.include("If you expect your subject to be `#{val}`, then add an assertion such as:")
              expect(err.message).to.include("`cy.wrap(#{val}).should('be.#{val}')`")
              expect(err.docsUrl).to.eq("https://on.cypress.io/its")
              done()

            cy.wrap(val).its("foo")

        it "throws does not accept additional arguments", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include("`cy.its()` does not accept additional arguments.")
            expect(err.docsUrl).to.eq("https://on.cypress.io/its")
            expect(lastLog.get("error").message).to.include(err.message)
            done()

          fn = -> "fn"
          fn.bar = -> "bar"
          fn.bar.baz = "baz"

          cy.wrap(fn).its("bar", { log: false }, "baz").should("eq", "baz")

        it "throws when options argument is not an object", (done) ->
          cy.on "fail", (err) =>
              lastLog = @lastLog
              expect(err.message).to.include "`cy.its()` only accepts an object as the options argument."
              expect(lastLog.get("error").message).to.include(err.message)
              done()

          cy.wrap({ foo: "string" }).its("foo", "bar")

        it "throws when property name is missing", (done) ->
          cy.on "fail", (err) =>
              lastLog = @lastLog
              expect(err.message).to.include "`cy.its()` expects the propertyName argument to have a value"
              expect(lastLog.get("error").message).to.include(err.message)
              done()

          cy.wrap({ foo: "foo"}).its()

        it "throws when property name is not of type string", (done) ->
          cy.on "fail", (err) =>
              lastLog = @lastLog
              expect(err.message).to.include "`cy.its()` only accepts a string or a number as the propertyName argument."
              expect(lastLog.get("error").message).to.include(err.message)
              done()

          cy.wrap({ foo: "foo"}).its(true)

        it "resets traversalErr and throws the right assertion", (done) ->
          cy.timeout(200)

          obj = {}

          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include("Timed out retrying: expected 'bar' to equal 'baz'")
            expect(lastLog.get("error").message).to.include(err.message)
            done()

          cy.on "command:retry", _.after 3, =>
            obj.foo = {
              bar: "bar"
            }

          cy.noop(obj).its("foo.bar").should("eq", "baz")

        it "consoleProps subject", (done) ->
          cy.on "fail", (err) =>
            expect(@lastLog.invoke("consoleProps")).to.deep.eq {
              Command: "its"
              Property: ".fizz.buzz"
              Error: """
              CypressError: Timed out retrying: `cy.its()` errored because the property: `fizz` does not exist on your subject.

              `cy.its()` waited for the specified property `fizz` to exist, but it never did.

              If you do not expect the property `fizz` to exist, then add an assertion such as:

              `cy.wrap({ foo: 'bar' }).its('quux').should('not.exist')`
              """
              Subject: {foo: "bar"}
              Yielded: undefined
            }
            done()

          cy.noop({foo: "bar"}).its("fizz.buzz")

  describe "without jquery", ->
    before ->
      cy
        .visit("/fixtures/dom.html")
        .then (win) ->
          @body = win.document.body.outerHTML

    beforeEach ->
      doc = cy.state("document")

      $(doc.body).empty().html(@body)

    context "#each", ->
      it "invokes callback function with runnable.ctx", ->
        ctx = @

        cy.wrap([1]).each ->
          expect(ctx is @).to.be.true

      it "can each a single element", ->
        count = 0

        cy.get("#dom").each ->
          count += 1
        .then ->
          expect(count).to.eq(1)

      it "passes the existing subject downstream without side effects", ->
        count = 0

        $lis = cy.$$("#list li")

        expect($lis).to.have.length(3)

        cy.get("#list li").each ($li, i, arr) ->
          expect(i).to.eq(count)
          count += 1
          expect(arr.length).to.eq(3)

          cy.wrap($li).should("have.class", "item")
        .then ($lis) ->
          expect(count).to.eq(3)
          expect($lis).to.have.length(3)

      it "awaits promises returned", ->
        count = 0

        start = new Date()

        cy.get("#list li").each ($li, i, arr) ->
          new Promise (resolve, reject) ->
            _.delay ->
              count += 1
              resolve()
            , 20
        .then ($lis) ->
          expect(count).to.eq(3)
          expect(new Date() - start).to.be.gt(60)

      it "supports array like structures", ->
        count = 0
        arr = [1,2,3]

        cy.wrap(arr).each (num, i, a) ->
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

        fn = cy.spy(fn)

        cy.wrap(arr).each(fn)
        .then (a) ->
          expect(fn).to.be.calledTwice

      it "works with nested eaches", ->
        count = 0

        cy.get("#list li").each ($li, i, arr) ->
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

        cy.get("div:first").each ($div) ->
          count += 1
        .then ->
          expect(count).to.eq(1)

      describe "errors", ->
        beforeEach ->
          Cypress.config("defaultCommandTimeout", 50)

          @logs = []

          cy.on "log:added", (attrs, log) =>
            @lastLog = log
            @logs?.push(log)

          return null

        it "can time out", (done) ->
          cy.on "fail", (err) =>
            ## get + each
            expect(@logs.length).to.eq(2)
            expect(err.message).to.include("`cy.each()` timed out after waiting `50ms`.\n\nYour callback function returned a promise which never resolved.")
            expect(err.docsUrl).to.include("https://on.cypress.io/each")
            done()

          cy.get("ul").each ($ul) ->
            new Promise (resolve) ->

        it "throws when not passed a callback function", (done) ->
          logs = []

          cy.on "log:added", (attrs, log) ->
            logs?.push(log)

          cy.on "fail", (err) =>
            ## get + each
            expect(@logs.length).to.eq(2)
            expect(err.message).to.include("`cy.each()` must be passed a callback function.")
            expect(err.docsUrl).to.eq('https://on.cypress.io/each')
            done()

          cy.get("ul").each({})

        it "throws when not passed a number", (done) ->
          cy.on "fail", (err) =>
            ## get + each
            expect(@logs.length).to.eq(2)
            expect(err.message).to.include("`cy.each()` can only operate on an array like subject. Your subject was: `100`")
            expect(err.docsUrl).to.eq('https://on.cypress.io/each')
            done()

          cy.wrap(100).each ->

        it "throws when not passed an array like structure", (done) ->
          cy.on "fail", (err) =>
            ## get + each
            expect(@logs.length).to.eq(2)
            expect(err.message).to.include("`cy.each()` can only operate on an array like subject. Your subject was: `{}`")
            expect(err.docsUrl).to.eq('https://on.cypress.io/each')
            done()

          cy.wrap({}).each ->

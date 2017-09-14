$ = Cypress.$.bind(Cypress)
_ = Cypress._

helpers = require("../../support/helpers")

describe "src/cy/commands/assertions", ->
  before ->
    cy
      .visit("/fixtures/jquery.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#should", ->
    beforeEach ->
      @logs = []

      cy.on "log:added", (attrs, log) =>
        @logs.push(log)
        @lastLog = log

      return null

    it "returns the subject for chainability", ->
      cy.noop({foo: "bar"}).should("deep.eq", {foo: "bar"}).then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

    it "can use negation", ->
      cy.noop(false).should("not.be.true")

    it "works with jquery chai", ->
      div = $("<div class='foo'>asdf</div>")

      cy.$$("body").append(div)

      cy
        .get("div.foo").should("have.class", "foo").then ($div) ->
          expect($div).to.match div
          $div.remove()

    it "can chain multiple assertions", ->
      cy
        .get("body")
          .should("contain", "div")
          .should("have.property", "length", 1)

    it "skips over utility commands", ->
      cy.on "command:retry", _.after 2, =>
        cy.$$("div:first").addClass("foo")

      cy.on "command:retry", _.after 4, =>
        cy.$$("div:first").attr("id", "bar")

      cy.get("div:first").should("have.class", "foo").debug().and("have.id", "bar")

    it "skips over aliasing", ->
      cy.on "command:retry", _.after 2, =>
        cy.$$("div:first").addClass("foo")

      cy.on "command:retry", _.after 4, =>
        cy.$$("div:first").attr("id", "bar")

      cy.get("div:first").as("div").should("have.class", "foo").debug().and("have.id", "bar")

    it "can change the subject", ->
      cy.get("input:first").should("have.property", "length").should("eq", 1).then (num) ->
        expect(num).to.eq(1)

    it "changes the subject with chai-jquery", ->
      cy.$$("input:first").attr("id", "input")

      cy.get("input:first").should("have.attr", "id").should("eq", "input")

    it "changes the subject with JSON", ->
      obj = {requestJSON: {teamIds: [2]}}
      cy.noop(obj).its("requestJSON").should("have.property", "teamIds").should("deep.eq", [2])

    ## TODO: make cy.then retry
    ## https://github.com/cypress-io/cypress/issues/627
    it.skip "outer assertions retry on cy.then", ->
      obj = {foo: "bar"}

      cy.wrap(obj).then ->
        setTimeout ->
          obj.foo = "baz"
        , 1000

        return obj
      .should("deep.eq", {foo: "baz"})

    it "does it retry when wrapped", ->
      obj = { foo: "bar" }

      cy.wrap(obj).then ->
        setTimeout ->
          obj.foo = "baz"
        , 100

        return cy.wrap(obj)
      .should("deep.eq", { foo: "baz" })

    describe "function argument", ->
      it "waits until function is true", ->
        button = cy.$$("button:first")

        cy.on "command:retry", _.after 2, =>
          button.addClass("ready")

        cy.get("button:first").should ($button) ->
          expect($button).to.have.class("ready")

      it "works with regular objects", ->
        obj = {}

        cy.on "command:retry", _.after 2, =>
          obj.foo = "bar"

        cy.wrap(obj).should (o) ->
          expect(o).to.have.property("foo").and.eq("bar")
        .then ->
          ## wrap + have property + and eq
          expect(@logs.length).to.eq(3)

      it "logs two assertions", ->
        _.delay =>
          cy.$$("body").addClass("foo")
        , Math.random() * 300

        _.delay =>
          cy.$$("body").prop("id", "bar")
        , Math.random() * 300

        cy
          .get("body").should ($body) ->
            expect($body).to.have.class("foo")
            expect($body).to.have.id("bar")
          .then ->
            cy.$$("body").removeClass("foo").removeAttr("id")

            expect(@logs.length).to.eq(3)

            ## the messages should have been updated to reflect
            ## the current state of the <body> element
            expect(@logs[1].get("message")).to.eq("expected **<body#bar.foo>** to have class **foo**")
            expect(@logs[2].get("message")).to.eq("expected **<body#bar.foo>** to have id **bar**")

      it "logs assertions as children even if subject is different", ->
        _.delay =>
          cy.$$("body").addClass("foo")
        , Math.random() * 300

        _.delay =>
          cy.$$("body").prop("id", "bar")
        , Math.random() * 300

        cy
          .get("body").should ($body) ->
            expect($body.attr("class")).to.match(/foo/)
            expect($body.attr("id")).to.include("bar")
          .then ->
            cy.$$("body").removeClass("foo").removeAttr("id")

            types = _.map @logs, (l) -> l.get("type")
            expect(types).to.deep.eq(["parent", "child", "child"])

            expect(@logs.length).to.eq(4)

      context "remote jQuery instances", ->
        beforeEach ->
          @remoteWindow = cy.state("window")

        it "yields the remote jQuery instance", ->
          @remoteWindow.$.fn.__foobar = fn = ->

          cy
            .get("input:first").should ($input) ->
              isInstanceOf = Cypress.utils.isInstanceOf($input, @remoteWindow.$)
              hasProp = $input.__foobar is fn

              expect(isInstanceOf).to.be.true
              expect(hasProp).to.to.true

    describe "not.exist", ->
      it "resolves eventually not exist", ->
        button = cy.$$("button:first")

        cy.on "command:retry", _.after 2, _.once ->
          button.remove()

        cy.get("button:first").click().should("not.exist")

      it "resolves all 3 assertions", (done) ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "assert"
            logs.push(log)

            if logs.length is 3
              done()

        cy
          .get("#does-not-exist1").should("not.exist")
          .get("#does-not-exist2").should("not.exist")
          .get("#does-not-exist3").should("not.exist")

    describe "have.text", ->
      it "resolves the assertion", ->
        cy.get("#list li").eq(0).should("have.text", "li 0").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe "have.length", ->
      it "allows valid string numbers", ->
        length = cy.$$("button").length

        cy.get("button").should("have.length", ""+length)

      it "throws when should('have.length') isnt a number", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "You must provide a valid number to a length assertion. You passed: 'asdf'"
          done()

        cy.get("button").should("have.length", "asdf")

      it "does not log extra commands on fail and properly fails command + assertions", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(6)

          expect(@logs[3].get("name")).to.eq("get")
          expect(@logs[3].get("state")).to.eq("failed")
          expect(@logs[3].get("error")).to.eq(err)

          expect(@logs[4].get("name")).to.eq("assert")
          expect(@logs[4].get("state")).to.eq("failed")
          expect(@logs[4].get("error").name).to.eq("AssertionError")

          done()

        cy
          .root().should("exist").and("contain", "foo")
          .get("button").should("have.length", "asdf")

      it "finishes failed assertions and does not log extra commands when cy.contains fails", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(2)

          expect(@logs[0].get("name")).to.eq("contains")
          expect(@logs[0].get("state")).to.eq("failed")
          expect(@logs[0].get("error")).to.eq(err)

          expect(@logs[1].get("name")).to.eq("assert")
          expect(@logs[1].get("state")).to.eq("failed")
          expect(@logs[1].get("error").name).to.eq("AssertionError")

          done()

        cy.contains("Nested Find").should("have.length", 2)

    describe "have.class", ->
      it "snapshots and ends the assertion after retrying", ->
        cy.on "command:retry", _.after 3, =>
          cy.$$("#foo").addClass("active")

        cy.contains("foo").should("have.class", "active").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "retries assertion until true", ->
        button = cy.$$("button:first")

        retry = _.after 3, ->
          button.addClass("new-class")

        cy.on "command:retry", retry

        cy.get("button:first").should("have.class", "new-class")

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

      it "should not be true", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "expected false to be true"
          done()

        cy.noop(false).should("be.true")

      it "throws err when not available chainable", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "The chainer: 'dee' was not found. Could not build assertion."
          done()

        cy.noop({}).should("dee.eq", {})

      it "throws err when ends with a non available chainable", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "The chainer: 'eq2' was not found. Could not build assertion."
          done()

        cy.noop({}).should("deep.eq2", {})

      it "logs 'should' when non available chainer", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(2)
          expect(lastLog.get("name")).to.eq("should")
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")
          expect(lastLog.get("message")).to.eq("not.contain2, does-not-exist-foo-bar")
          done()

        cy.get("div:first").should("not.contain2", "does-not-exist-foo-bar")

      it "throws when eventually times out", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "Timed out retrying: expected '<button>' to have class 'does-not-have-class'"
          done()

        cy.get("button:first").should("have.class", "does-not-have-class")

      it "throws when the subject isnt in the DOM", (done) ->
        cy.$$("button:first").click ->
          $(@).addClass("foo").remove()

        cy.on "fail", (err) =>
          names = _.invokeMap(@logs, "get", "name")

          ## the 'should' is not here because based on
          ## when we check for the element to be detached
          ## it never actually runs the assertion
          expect(names).to.deep.eq(["get", "click"])
          expect(err.message).to.include "cy.should() failed because this element is detached"
          done()

        cy.get("button:first").click().should("have.class", "foo").then ->
          done("cy.should was supposed to fail")

      it "throws when the subject eventually isnt in the DOM", (done) ->
        cy.timeout(200)

        button = cy.$$("button:first")

        cy.on "command:retry", _.after 2, _.once ->
          button.addClass("foo").remove()

        cy.on "fail", (err) =>
          names = _.invokeMap(@logs, "get", "name")

          ## should is present here due to the retry
          expect(names).to.deep.eq(["get", "click", "assert"])
          expect(err.message).to.include "cy.should() failed because this element is detached"
          done()

        cy.get("button:first").click().should("have.class", "foo").then ->
          done("cy.should was supposed to fail")

      it "throws when should('have.length') isnt a number", (done) ->
        ## we specifically turn off logging have.length validation errors
        ## because the assertion will already be logged
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(3)
          expect(err.message).to.eq "You must provide a valid number to a length assertion. You passed: 'foo'"
          expect(lastLog.get("name")).to.eq("should")
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")
          expect(lastLog.get("message")).to.eq("have.length, foo")
          done()

        cy.get("button").should("have.length", "foo")

      it "eventually.have.length is deprecated", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(2)
          expect(err.message).to.eq "The 'eventually' assertion chainer has been deprecated. This is now the default behavior so you can safely remove this word and everything should work as before."
          expect(lastLog.get("name")).to.eq("should")
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")
          expect(lastLog.get("message")).to.eq("eventually.have.length, 1")
          done()

        cy.get("div:first").should("eventually.have.length", 1)

      it "does not additionally log when .should is the current command", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("name")).to.eq("should")
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")
          expect(lastLog.get("message")).to.eq("deep.eq2, {}")

          done()

        cy.noop({}).should("deep.eq2", {})

      it "logs and immediately fails on custom match assertions", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(2)
          expect(err.message).to.eq "'match' requires its argument be a 'RegExp'. You passed: 'foo'"
          expect(lastLog.get("name")).to.eq("should")
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")
          expect(lastLog.get("message")).to.eq("match, foo")
          done()

        cy.wrap("foo").should("match", "foo")

      it "does not log ensureElExistence errors", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          done()

        cy.get("#does-not-exist")

      it "throws if used as a parent command", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(err.message).to.include("looks like you are trying to call a child command before running a parent command")

          done()

        cy.should ->

    describe ".log", ->
      it "is type child", ->
        cy.get("button").should("match", "button").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("type")).to.eq("child")

      it "is type child when alias between assertions", ->
        cy.get("button").as("btn").should("match", "button").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("type")).to.eq("child")

  context "#and", ->
    it "proxies to #should", ->
      cy.noop({foo: "bar"}).should("have.property", "foo").and("eq", "bar")

  context "#assert", ->
    beforeEach ->
      @logs = []

      cy.on "log:added", (attrs, log) =>
        @logs.push(log)

        if attrs.name is "assert"
          @lastLog = log

      return null

    it "does not output should logs on failures", (done) ->
      cy.on "fail", =>
        length = @logs.length

        expect(length).to.eq(1)
        done()

      cy.noop({}).should("have.property", "foo")

    it "ends and snapshots immediately and sets child", (done) ->
      cy.on "log:added", (attrs, log) =>
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")

          expect(log.get("ended")).to.be.true
          expect(log.get("state")).to.eq("passed")
          expect(log.get("snapshots").length).to.eq(1)
          expect(log.get("snapshots")[0]).to.be.an("object")
          expect(log.get("type")).to.eq "child"

          done()

      cy.get("body").then ->
        expect(cy.state("subject")).to.match "body"

    it "sets type to child when subject matches", (done) ->
      cy.on "log:added", (attrs, log) =>
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")
          expect(log.get("type")).to.eq "child"
          done()

      cy.wrap("foo").then ->
        expect("foo").to.eq("foo")

    it "sets type to child current command had arguments but does not match subject", (done) ->
      cy.on "log:added", (attrs, log) =>
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")
          expect(log.get("type")).to.eq "child"
          done()

      cy.get("body").then ($body) ->
        expect($body.length).to.eq(1)

    it "sets type to parent when assertion did not involve current subject and didnt have arguments", (done) ->
      cy.on "log:added", (attrs, log) =>
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")
          expect(log.get("type")).to.eq "parent"
          done()

      cy.get("body").then ->
        expect(true).to.be.true

    it "removes rest of line when passing assertion includes ', but' for jQuery subjects", (done) ->
      cy.on "log:added", (attrs, log) ->
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")
          expect(log.get("message")).to.eq "expected **<a>** to have attribute **href** with the value **#**"
          done()

      cy.get("a:first").then ($a) ->
        expect($a).to.have.attr "href", "#"

    it "does not replaces instances of word: 'but' with 'and' for failing assertion", (done) ->
      cy.on "log:added", (attrs, log) ->
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")

          expect(log.get("message")).to.eq "expected **<a>** to have attribute **href** with the value **asdf**, but the value was **#**"
          done()

      cy.get("a:first").then ($a) ->
        try
          expect($a).to.have.attr "href", "asdf"
        catch

    it "does not replace 'button' with 'andton'", (done) ->
      cy.on "log:added", (attrs, log) ->
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")

          expect(log.get("message")).to.eq "expected **<button>** to be **visible**"
          done()

      cy.get("button:first").then ($button) ->
        expect($button).to.be.visible

    it "#consoleProps for regular objects", (done) ->
      cy.on "log:added", (attrs, log) =>
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")

          expect(log.invoke("consoleProps")).to.deep.eq {
            Command: "assert"
            expected: 1
            actual: 1
            Message: "expected 1 to equal 1"
          }

          done()

      cy.then ->
        expect(1).to.eq 1

    it "#consoleProps for DOM objects", (done) ->
      cy.on "log:added", (attrs, log) =>
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")

          expect(log.invoke("consoleProps")).to.deep.eq {
            Command: "assert"
            subject: log.get("subject")
            Message: "expected <body> to have a property length"
          }

          done()

      cy
        .get("body").then ($body) ->
          expect($body).to.have.property("length")

    it "#consoleProps for errors", (done) ->
      cy.on "log:added", (attrs, log) =>
        if attrs.name is "assert"
          cy.removeAllListeners("log:added")

          expect(log.invoke("consoleProps")).to.deep.eq {
            Command: "assert"
            expected: false
            actual: true
            Message: "expected true to be false"
            Error: log.get("error").toString()
          }
          done()

      cy.then ->
        try
          expect(true).to.be.false
        catch err

    describe "#patchAssert", ->
      it "wraps \#{this} and \#{exp} in \#{b}", (done) ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "assert"
            cy.removeAllListeners("log:added")

            expect(log.get("message")).to.eq "expected **foo** to equal **foo**"
            done()

        cy.then ->
          expect("foo").to.eq "foo"

      it "doesnt mutate error message", ->
        cy.then ->
          try
            expect(true).to.eq false
          catch e
            expect(e.message).to.eq "expected true to equal false"

      describe "jQuery elements", ->
        it "sets _obj to selector", (done) ->
          cy.on "log:added", (attrs, log) =>
            if attrs.name is "assert"
              cy.removeAllListeners("log:added")

              expect(log.get("message")).to.eq "expected **<body>** to exist in the DOM"
              done()

          cy.get("body").then ($body) ->
            expect($body).to.exist

        describe "without selector", ->
          it "exists", (done) ->
            cy.on "log:added", (attrs, log) =>
              if attrs.name is "assert"
                cy.removeAllListeners("log:added")

                expect(log.get("message")).to.eq "expected **<div>** to exist in the DOM"
                done()

            ## prepend an empty div so it has no id or class
            cy.$$("body").prepend $("<div />")

            cy.get("div").eq(0).then ($div) ->
              # expect($div).to.match("div")
              expect($div).to.exist

          it "uses element name", (done) ->
            cy.on "log:added", (attrs, log) =>
              if attrs.name is "assert"
                cy.removeAllListeners("log:added")

                expect(log.get("message")).to.eq "expected **<input>** to match **input**"
                done()

            ## prepend an empty div so it has no id or class
            cy.$$("body").prepend $("<input />")

            cy.get("input").eq(0).then ($div) ->
              expect($div).to.match("input")

        describe "property assertions", ->
          it "has property", (done) ->
            cy.on "log:added", (attrs, log) ->
              if attrs.name is "assert"
                cy.removeAllListeners("log:added")

                expect(log.get("message")).to.eq "expected **<button>** to have a property **length**"
                done()

            cy.get("button:first").should("have.property", "length")

          it "passes on expected subjects without changing them", ->
            cy.state("window").$.fn.foo = "bar"

            cy
              .get("input:first").then ($input) ->
                expect($input).to.have.property("foo", "bar")

  context "chai assert", ->
    beforeEach ->
      @logs = []

      cy.on "log:added", (attrs, log) =>
        @logs.push(log)

      return null

    it "equal", ->
      assert.equal(1, 1, "one is one")
      expect(@logs[0].get("message")).to.eq("one is one: expected **1** to equal **1**")

    it "isOk", ->
      assert.isOk({}, "is okay")
      expect(@logs[0].get("message")).to.eq("is okay: expected **{}** to be truthy")

    it "isFalse", ->
      assert.isFalse(false, "is false")
      expect(@logs[0].get("message")).to.eq("is false: expected **false** to be false")

  context "chai overrides", ->
    beforeEach ->
      @$body = cy.$$("body")

    describe "#contain", ->
      it "can find input type submit by value", ->
        $input = cy.$$("<input type='submit' value='click me' />").appendTo(@$body)

        cy.get("input[type=submit]").should("contain", "click me")

      it "is true when element contains text", ->
        cy.get("div").should("contain", "Nested Find")

      it "calls super when not DOM element", ->
        cy.noop("foobar").should("contain", "oob")

      it "escapes quotes", ->
        $span = "<span id=\"escape-quotes\">shouldn't and can\"t</span>"

        cy.$$($span).appendTo cy.$$("body")

        cy.get("#escape-quotes").should("contain", "shouldn't")

    describe "#match", ->
      it "calls super when provided a regex", ->
        expect("foo").to.match(/foo/)

      it "throws when not provided a regex", ->
        fn = ->
          expect("foo").to.match("foo")

        expect(fn).to.throw("'match' requires its argument be a 'RegExp'. You passed: 'foo'")

      it "throws with cy.should", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "'match' requires its argument be a 'RegExp'. You passed: 'bar'"
          done()

        cy.noop("foo").should("match", "bar")

      it "does not affect DOM element matching", ->
        cy.get("body").should("match", "body")

    describe "#exist", ->
      it "uses $el.selector in expectation", (done) ->
        cy.on "log:added", (attrs, log) ->
          if attrs.name is "assert"
            cy.removeAllListeners("log:added")

            expect(log.get("message")).to.eq("expected **#does-not-exist** not to exist in the DOM")
            done()

        cy.get("#does-not-exist").should("not.exist")

    describe "#be.visible", ->
      it "sets type to child", (done) ->
        cy.on "log:added", (attrs, log) ->
          if attrs.name is "assert"
            cy.removeAllListeners("log:added")

            expect(log.get("type")).to.eq("child")
            done()

        cy
          .get("body")
          .get("button").should("be.visible")

    describe "#have.length", ->
      it "formats _obj with cypress", (done) ->
        cy.on "log:added", (attrs, log) ->
          if attrs.name is "assert"
            cy.removeAllListeners("log:added")

            expect(log.get("message")).to.eq("expected **<button>** to have a length of **1**")
            done()

        cy.get("button:first").should("have.length", 1)

      it "formats error _obj with cypress", (done) ->
        cy.on "log:added", (attrs, log) ->
          if attrs.name is "assert"
            cy.removeAllListeners("log:added")

            expect(log.get("_error").message).to.eq("expected '<body>' to have a length of 2 but got 1")
            done()

        cy.get("body").should("have.length", 2)

      it "does not touch non DOM objects", ->
        cy.noop([1,2,3]).should("have.length", 3)

      it "rejects any element not in the document", ->
        cy.$$("<button />").appendTo(@$body)
        cy.$$("<button />").appendTo(@$body)

        buttons = cy.$$("button")

        length = buttons.length

        cy.on "command:retry", _.after 2, =>
          cy.$$("button:last").remove()

        cy.wrap(buttons).should("have.length", length - 1)

  context "chai plugins", ->
    beforeEach ->
      @logs = []

      cy.on "log:added", (attrs, log) =>
        @logs.push(log)

      return null

    context "data", ->
      beforeEach ->
        @$div = $("<div data-foo='bar' />")
        @$div.data = -> throw new Error("data called")

      it "no prop, with prop, negation, and chainable", ->
        expect(@$div).to.have.data("foo") ## 1
        expect(@$div).to.have.data("foo", "bar") ## 2,3
        expect(@$div).to.have.data("foo").and.eq("bar") ## 4,5
        expect(@$div).to.have.data("foo").and.match(/bar/) ## 6,7
        expect(@$div).not.to.have.data("baz") ## 8

        expect(@logs.length).to.eq(8)

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.be.ok
          expect(err.message).to.include("> data")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.have.data("foo")

    context "class", ->
      beforeEach ->
        @$div = $("<div class='foo bar' />")
        @$div.hasClass = -> throw new Error("hasClass called")

      it "class, not class", ->
        expect(@$div).to.have.class("foo") ## 1
        expect(@$div).to.have.class("bar") ## 2
        expect(@$div).not.to.have.class("baz") ## 3

        expect(@logs.length).to.eq(3)

        l1 = @logs[0]
        l3 = @logs[2]

        expect(l1.get("message")).to.eq(
          "expected **<div.foo.bar>** to have class **foo**"
        )

        expect(l3.get("message")).to.eq(
          "expected **<div.foo.bar>** not to have class **baz**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected 'foo' to have class 'bar'"
          )
          expect(err.message).to.include("> class")
          expect(err.message).to.include("> foo")

          done()

        expect("foo").to.have.class("bar")

    context "id", ->
      beforeEach ->
        @$div = $("<div id='foo' />")
        @$div.prop = -> throw new Error("prop called")
        @$div.attr = -> throw new Error("attr called")

        @$div2 = $("<div />")
        @$div2.prop("id", "foo")
        @$div2.prop = -> throw new Error("prop called")
        @$div2.attr = -> throw new Error("attr called")

        @$div3 = $("<div />")
        @$div3.attr("id", "foo")
        @$div3.prop = -> throw new Error("prop called")
        @$div3.attr = -> throw new Error("attr called")

      it "id, not id", ->
        expect(@$div).to.have.id("foo") ## 1
        expect(@$div).not.to.have.id("bar") ## 2

        expect(@$div2).to.have.id("foo") ## 3

        expect(@$div3).to.have.id("foo") ## 4

        expect(@logs.length).to.eq(4)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<div#foo>** to have id **foo**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div#foo>** not to have id **bar**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected [] to have id 'foo'"
          )
          expect(err.message).to.include("> id")
          expect(err.message).to.include("> []")

          done()

        expect([]).to.have.id("foo")

    context "html", ->
      beforeEach ->
        @$div = $("<div><button>button</button></div>")
        @$div.html = -> throw new Error("html called")

      it "html, not html", ->
        expect(@$div).to.have.html("<button>button</button>") ## 1
        expect(@$div).not.to.have.html("foo") ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have HTML **<button>button</button>**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to have HTML **foo**"
        )

        try
          expect(@$div).to.have.html("<span>span</span>")
        catch err
          l6 = @logs[5]

          expect(l6.get("message")).to.eq(
            "expected **<div>** to have HTML **<span>span</span>**, but the HTML was **<button>button</button>**"
          )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected null to have HTML 'foo'"
          )
          expect(err.message).to.include("> html")
          expect(err.message).to.include("> null")

          done()

        expect(null).to.have.html("foo")

    context "text", ->
      beforeEach ->
        @$div = $("<div>foo</div>")
        @$div.text = -> throw new Error("text called")

      it "text, not text", ->
        expect(@$div).to.have.text("foo") ## 1
        expect(@$div).not.to.have.text("bar") ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have text **foo**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to have text **bar**"
        )

        try
          expect(@$div).to.have.text("bar")
        catch err
          l6 = @logs[5]

          expect(l6.get("message")).to.eq(
            "expected **<div>** to have text **bar**, but the text was **foo**"
          )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected undefined to have text 'foo'"
          )
          expect(err.message).to.include("> text")
          expect(err.message).to.include("> undefined")

          done()

        expect(undefined).to.have.text("foo")

    context "value", ->
      beforeEach ->
        @$input = $("<input value='foo' />")
        @$input.val = -> throw new Error("val called")

      it "value, not value", ->
        expect(@$input).to.have.value("foo") ## 1
        expect(@$input).not.to.have.value("bar") ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<input>** to have value **foo**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<input>** not to have value **bar**"
        )

        try
          expect(@$input).to.have.value("bar")
        catch err
          l6 = @logs[5]

          expect(l6.get("message")).to.eq(
            "expected **<input>** to have value **bar**, but the value was **foo**"
          )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to have value 'foo'"
          )
          expect(err.message).to.include("> value")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.have.value("foo")

    context "descendants", ->
      beforeEach ->
        @$div = $("<div><button>button</button></div>")
        @$div.has = -> throw new Error("has called")

      it "descendants, not descendants", ->
        expect(@$div).to.have.descendants("button") ## 1
        expect(@$div).not.to.have.descendants("input") ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have descendants **button**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to have descendants **input**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to have descendants 'foo'"
          )
          expect(err.message).to.include("> descendants")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.have.descendants("foo")

    context "visible", ->
      beforeEach ->
        @$div = $("<div>div</div>").appendTo($("body"))
        @$div.is = -> throw new Error("is called")

        @$div2 = $("<div style='display: none'>div</div>").appendTo($("body"))
        @$div2.is = -> throw new Error("is called")

      afterEach ->
        @$div.remove()
        @$div2.remove()

      it "visible, not visible, adds to error", ->
        expect(@$div).to.be.visible ## 1
        expect(@$div2).not.to.be.visible ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<div>** to be **visible**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to be **visible**"
        )

        try
          expect(@$div2).to.be.visible
        catch err
          l6 = @logs[5]

          ## the error on this log should have this message appended to it
          expect(l6.get("error").message).to.eq(
            """
            expected '<div>' to be 'visible'

            This element '<div>' is not visible because it has CSS property: 'display: none'
            """
          )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to be 'visible'"
          )
          expect(err.message).to.include("> visible")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.be.visible

    context "hidden", ->
      beforeEach ->
        @$div = $("<div style='display: none'>div</div>").appendTo($("body"))
        @$div.is = -> throw new Error("is called")

        @$div2 = $("<div>div</div>").appendTo($("body"))
        @$div2.is = -> throw new Error("is called")

      afterEach ->
        @$div.remove()
        @$div2.remove()

      it "hidden, not hidden, adds to error", ->
        expect(@$div).to.be.hidden ## 1
        expect(@$div2).not.to.be.hidden ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<div>** to be **hidden**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to be **hidden**"
        )

        try
          expect(@$div2).to.be.hidden
        catch err
          l6 = @logs[5]

          ## the error on this log should have this message appended to it
          expect(l6.get("error").message).to.eq("expected '<div>' to be 'hidden'")

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to be 'hidden'"
          )
          expect(err.message).to.include("> hidden")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.be.hidden

    context "selected", ->
      beforeEach ->
        @$option = $("<option selected>option</option>")
        @$option.is = -> throw new Error("is called")

        @$option2 = $("<option>option</option>")
        @$option2.is = -> throw new Error("is called")

      it "selected, not selected", ->
        expect(@$option).to.be.selected ## 1
        expect(@$option2).not.to.be.selected ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<option>** to be **selected**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<option>** not to be **selected**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to be 'selected'"
          )
          expect(err.message).to.include("> selected")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.be.selected

    context "checked", ->
      beforeEach ->
        @$input = $("<input type='checkbox' checked />")
        @$input.is = -> throw new Error("is called")

        @$input2 = $("<input type='checkbox' />")
        @$input2.is = -> throw new Error("is called")

      it "checked, not checked", ->
        expect(@$input).to.be.checked ## 1
        expect(@$input2).not.to.be.checked ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<input>** to be **checked**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<input>** not to be **checked**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to be 'checked'"
          )
          expect(err.message).to.include("> checked")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.be.checked

    context "enabled", ->
      beforeEach ->
        @$input = $("<input />")
        @$input.is = -> throw new Error("is called")

        @$input2 = $("<input disabled />")
        @$input2.is = -> throw new Error("is called")

      it "enabled, not enabled", ->
        expect(@$input).to.be.enabled ## 1
        expect(@$input2).not.to.be.enabled ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<input>** to be **enabled**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<input>** not to be **enabled**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to be 'enabled'"
          )
          expect(err.message).to.include("> enabled")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.be.enabled

    context "disabled", ->
      beforeEach ->
        @$input = $("<input disabled />")
        @$input.is = -> throw new Error("is called")

        @$input2 = $("<input />")
        @$input2.is = -> throw new Error("is called")

      it "disabled, not disabled", ->
        expect(@$input).to.be.disabled ## 1
        expect(@$input2).not.to.be.disabled ## 2

        expect(@logs.length).to.eq(2)

        l1 = @logs[0]
        l2 = @logs[1]

        expect(l1.get("message")).to.eq(
          "expected **<input>** to be **disabled**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<input>** not to be **disabled**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to be 'disabled'"
          )
          expect(err.message).to.include("> disabled")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.be.disabled

    context "exist", ->
      it "passes thru non DOM", ->
        expect([]).to.exist
        expect({}).to.exist
        expect('foo').to.exist

        expect(@logs.length).to.eq(3)

        l1 = @logs[0]
        l2 = @logs[1]
        l3 = @logs[2]

        expect(l1.get("message")).to.eq(
          "expected **[]** to exist"
        )

        expect(l2.get("message")).to.eq(
          "expected **{}** to exist"
        )

        expect(l3.get("message")).to.eq(
          "expected **foo** to exist"
        )

    context "empty", ->
      beforeEach ->
        @div = $("<div></div>")
        @div.is = -> throw new Error("is called")

        @div2 = $("<div><button>button</button></div>")
        @div2.is = -> throw new Error("is called")

      it "passes thru non DOM", ->
        expect([]).to.be.empty
        expect({}).to.be.empty
        expect('').to.be.empty

        expect(@logs.length).to.eq(3)

        l1 = @logs[0]
        l2 = @logs[1]
        l3 = @logs[2]

        expect(l1.get("message")).to.eq(
          "expected **[]** to be empty"
        )

        expect(l2.get("message")).to.eq(
          "expected **{}** to be empty"
        )

        expect(l3.get("message")).to.eq(
          "expected **''** to be empty"
        )

      it "empty, not empty, raw dom documents", ->
        expect(@div).to.be.empty ## 1
        expect(@div2).not.to.be.empty ## 2

        expect(@div.get(0)).to.be.empty ## 3
        expect(@div2.get(0)).not.to.be.empty ## 4

        expect(@logs.length).to.eq(4)

        l1 = @logs[0]
        l2 = @logs[1]
        l3 = @logs[2]
        l4 = @logs[3]

        expect(l1.get("message")).to.eq(
          "expected **<div>** to be **empty**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to be **empty**"
        )

        expect(l3.get("message")).to.eq(
          "expected **<div>** to be **empty**"
        )

        expect(l4.get("message")).to.eq(
          "expected **<div>** not to be **empty**"
        )

    context "match", ->
      beforeEach ->
        @div = $("<div></div>")
        @div.is = -> throw new Error("is called")

      it "passes thru non DOM", ->
        expect('foo').to.match(/f/)

        expect(@logs.length).to.eq(1)

        l1 = @logs[0]

        expect(l1.get("message")).to.eq(
          "expected **foo** to match /f/"
        )

      it "match, not match, raw dom documents", ->
        expect(@div).to.match("div") ## 1
        expect(@div).not.to.match("button") ## 2

        expect(@div.get(0)).to.match("div") ## 3
        expect(@div.get(0)).not.to.match("button") ## 4

        expect(@logs.length).to.eq(4)

        l1 = @logs[0]
        l2 = @logs[1]
        l3 = @logs[2]
        l4 = @logs[3]

        expect(l1.get("message")).to.eq(
          "expected **<div>** to match **div**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div>** not to match **button**"
        )

        expect(l3.get("message")).to.eq(
          "expected **<div>** to match **div**"
        )

        expect(l4.get("message")).to.eq(
          "expected **<div>** not to match **button**"
        )

    context "contain", ->
      it "passes thru non DOM", ->
        expect(['foo']).to.contain('foo') ## 1
        expect({foo: 'bar', baz: "quux"}).to.contain({foo: "bar"}) ## 2, 3
        expect('foo').to.contain('fo') ## 4

        expect(@logs.length).to.eq(4)

        l1 = @logs[0]
        l2 = @logs[1]
        l3 = @logs[2]
        l4 = @logs[3]

        expect(l1.get("message")).to.eq(
          "expected **[ foo ]** to include **foo**"
        )

        expect(l2.get("message")).to.eq(
          "expected **{ foo: bar, baz: quux }** to have a property **foo**"
        )

        expect(l3.get("message")).to.eq(
          "expected **{ foo: bar, baz: quux }** to have a property **foo** of **bar**"
        )

        expect(l4.get("message")).to.eq(
          "expected **foo** to include **fo**"
        )

    context "attr", ->
      beforeEach ->
        @$div = $("<div foo='bar'>foo</div>")
        @$div.attr = -> throw new Error("attr called")

        @$a = $("<a href='https://google.com'>google</a>")
        @$a.attr = -> throw new Error("attr called")

      it "attr, not attr", ->
        expect(@$div).to.have.attr("foo") ## 1
        expect(@$div).to.have.attr("foo", "bar") ## 2
        expect(@$div).not.to.have.attr("bar") ## 3
        expect(@$div).not.to.have.attr("bar", "baz") ## 4
        expect(@$div).not.to.have.attr("foo", "baz") ## 5

        expect(@$a).to.have.attr("href").and.match(/google/) ## 6, 7
        expect(@$a)
        .to.have.attr("href", "https://google.com") ## 8
        .and.have.text("google") ## 9

        try
          expect(@$a).not.to.have.attr("href", "https://google.com") ## 10
        catch error

        expect(@logs.length).to.eq(10)

        l1 = @logs[0]
        l2 = @logs[1]
        l3 = @logs[2]
        l4 = @logs[3]
        l5 = @logs[4]
        l6 = @logs[5]
        l7 = @logs[6]
        l8 = @logs[7]
        l9 = @logs[8]
        l10 = @logs[9]

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have attribute **foo**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div>** to have attribute **foo** with the value **bar**"
        )

        expect(l3.get("message")).to.eq(
          "expected **<div>** not to have attribute **bar**"
        )

        expect(l4.get("message")).to.eq(
          "expected **<div>** not to have attribute **bar**"
        )

        expect(l5.get("message")).to.eq(
          "expected **<div>** not to have attribute **foo** with the value **baz**"
        )

        expect(l6.get("message")).to.eq(
          "expected **<a>** to have attribute **href**"
        )

        expect(l7.get("message")).to.eq(
          "expected **https://google.com** to match /google/"
        )

        expect(l8.get("message")).to.eq(
          "expected **<a>** to have attribute **href** with the value **https://google.com**"
        )

        expect(l9.get("message")).to.eq(
          "expected **<a>** to have text **google**"
        )

        expect(l10.get("message")).to.eq(
          "expected **<a>** not to have attribute **href** with the value **https://google.com**, but the value was **https://google.com**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to have attribute 'foo'"
          )
          expect(err.message).to.include("> attr")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.have.attr("foo")

    context "prop", ->
      beforeEach ->
        @$input = $("<input type='checkbox' />")
        @$input.prop("checked", true)
        @$input.prop = -> throw new Error("prop called")

        @$a = $("<a href='/foo'>google</a>")
        @$a.prop = -> throw new Error("prop called")

      it "prop, not prop", ->
        expect(@$input).to.have.prop("checked") ## 1
        expect(@$input).to.have.prop("checked", true) ## 2
        expect(@$input).not.to.have.prop("bar") ## 3
        expect(@$input).not.to.have.prop("bar", "baz") ## 4
        expect(@$input).not.to.have.prop("checked", "baz") ## 5

        href = window.location.origin + "/foo"

        expect(@$a).to.have.prop("href").and.match(/foo/) ## 6, 7
        expect(@$a)
        .to.have.prop("href", href) ## 8
        .and.have.text("google") ## 9

        try
          expect(@$a).not.to.have.prop("href", href) ## 10
        catch error

        expect(@logs.length).to.eq(10)

        l1 = @logs[0]
        l2 = @logs[1]
        l3 = @logs[2]
        l4 = @logs[3]
        l5 = @logs[4]
        l6 = @logs[5]
        l7 = @logs[6]
        l8 = @logs[7]
        l9 = @logs[8]
        l10 = @logs[9]

        expect(l1.get("message")).to.eq(
          "expected **<input>** to have property **checked**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<input>** to have property **checked** with the value **true**"
        )

        expect(l3.get("message")).to.eq(
          "expected **<input>** not to have property **bar**"
        )

        expect(l4.get("message")).to.eq(
          "expected **<input>** not to have property **bar**"
        )

        expect(l5.get("message")).to.eq(
          "expected **<input>** not to have property **checked** with the value **baz**"
        )

        expect(l6.get("message")).to.eq(
          "expected **<a>** to have property **href**"
        )

        expect(l7.get("message")).to.eq(
          "expected **#{href}** to match /foo/"
        )

        expect(l8.get("message")).to.eq(
          "expected **<a>** to have property **href** with the value **#{href}**"
        )

        expect(l9.get("message")).to.eq(
          "expected **<a>** to have text **google**"
        )

        expect(l10.get("message")).to.eq(
          "expected **<a>** not to have property **href** with the value **#{href}**, but the value was **#{href}**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to have property 'foo'"
          )
          expect(err.message).to.include("> prop")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.have.prop("foo")

    context "css", ->
      beforeEach ->
        @$div = $("<div style='display: none'>div</div>")
        @$div.css = -> throw new Error("css called")

      it "css, not css", ->
        expect(@$div).to.have.css("display") ## 1
        expect(@$div).to.have.css("display", "none") ## 2
        expect(@$div).not.to.have.css("bar") ## 3
        expect(@$div).not.to.have.css("bar", "baz") ## 4
        expect(@$div).not.to.have.css("display", "inline") ## 5

        try
          expect(@$div).not.to.have.css("display", "none") ## 6
        catch error

        expect(@logs.length).to.eq(6)

        l1 = @logs[0]
        l2 = @logs[1]
        l3 = @logs[2]
        l4 = @logs[3]
        l5 = @logs[4]
        l6 = @logs[5]

        expect(l1.get("message")).to.eq(
          "expected **<div>** to have CSS property **display**"
        )

        expect(l2.get("message")).to.eq(
          "expected **<div>** to have CSS property **display** with the value **none**"
        )

        expect(l3.get("message")).to.eq(
          "expected **<div>** not to have CSS property **bar**"
        )

        expect(l4.get("message")).to.eq(
          "expected **<div>** not to have CSS property **bar**"
        )

        expect(l5.get("message")).to.eq(
          "expected **<div>** not to have CSS property **display** with the value **inline**"
        )

        expect(l6.get("message")).to.eq(
          "expected **<div>** not to have CSS property **display** with the value **none**, but the value was **none**"
        )

      it "throws when obj is not DOM", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error").message).to.eq(
            "expected {} to have CSS property 'foo'"
          )
          expect(err.message).to.include("> css")
          expect(err.message).to.include("> {}")

          done()

        expect({}).to.have.css("foo")

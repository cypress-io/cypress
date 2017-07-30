$ = Cypress.$.bind(Cypress)
_ = Cypress._

helpers = require("../../support/helpers")

describe "src/cy/commands/assertions", ->
  before ->
    cy
      .visit("/support/server/fixtures/jquery.html")
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

          expect(err.message).to.include "cy.should() failed because this element you are chaining off of has become detached or removed from the DOM:"
          # expect(@logs.length).to.eq(3)
          # expect(lastLog.get("name")).to.eq("should")
          # expect(lastLog.get("error")).to.eq(err)
          # expect(lastLog.get("state")).to.eq("failed")
          # expect(lastLog.get("snapshots").length).to.eq(1)
          # expect(lastLog.get("snapshots")[0]).to.be.an("object")
          # expect(lastLog.get("message")).to.eq("have.class, foo")
          done()

        cy.get("button:first").click().should("have.class", "foo").then ->
          done("cy.should was supposed to fail")

      it "throws when the subject eventually isnt in the DOM", (done) ->
        cy.timeout(200)

        button = cy.$$("button:first")

        cy.on "command:retry", _.after 2, _.once ->
          button.addClass("foo").remove()

        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.should() failed because this element you are chaining off of has become detached or removed from the DOM:"
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
            subject: helpers.getFirstSubjectByName("get")
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
            cy.on "log:added", (attrs, log) =>
              if attrs.name is "assert"
                cy.removeAllListeners("log:added")

                expect(log.get("message")).to.eq "expected **<button>** to have a property **length**"
                done()

            cy.get("button:first").should("have.property", "length")

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

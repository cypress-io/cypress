describe "$Cypress.Cy Assertion Commands", ->
  enterCommandTestingMode()

  context "#should", ->
    beforeEach ->
      @chai = $Cypress.Chai.create(@Cypress, {})

    afterEach ->
      @chai.restore()

    it "returns the subject for chainability", ->
      @cy.noop({foo: "bar"}).should("deep.eq", {foo: "bar"}).then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

    it "can use negation", ->
      @cy.noop(false).should("not.be.true")

    it "works with jquery chai", ->
      div = $("<div class='foo'>asdf</div>")

      @cy.$("body").append(div)

      @cy
        .get("div.foo").should("have.class", "foo").then ($div) ->
          expect($div).to.match div
          $div.remove()

    it "can chain multiple assertions", ->
      @cy
        .get("body")
          .should("contain", "DOM Fixture")
          .should("have.property", "length", 1)

    it "skips over utility commands", ->
      @cy.on "retry", _.after 2, =>
        @cy.$("div:first").addClass("foo")

      @cy.on "retry", _.after 4, =>
        @cy.$("div:first").attr("id", "bar")

      @cy.get("div:first").should("have.class", "foo").debug().and("have.id", "bar")

    it "skips over aliasing", ->
      @cy.on "retry", _.after 2, =>
        @cy.$("div:first").addClass("foo")

      @cy.on "retry", _.after 4, =>
        @cy.$("div:first").attr("id", "bar")

      @cy.get("div:first").as("div").should("have.class", "foo").debug().and("have.id", "bar")

    it "can change the subject", ->
      @cy.get("input:first").should("have.property", "length").should("eq", 1).then (num) ->
        expect(num).to.eq(1)

    it "changes the subject with chai-jquery", ->
      @cy.get("input:first").should("have.attr", "id").should("eq", "input")

    it "changes the subject with JSON", ->
      obj = {requestJSON: {teamIds: [2]}}
      @cy.noop(obj).its("requestJSON").should("have.property", "teamIds").should("deep.eq", [2])

    describe "not.exist", ->
      it "resolves eventually not exist", ->
        button = @cy.$("button:first")

        @cy.on "retry", _.after 2, _.once ->
          button.remove()

        @cy.get("button:first").click().should("not.exist")

      it "resolves all 3 assertions", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          if log.get("name") is "assert"
            logs.push(log)

            if logs.length is 3
              done()

        @cy
          .get("#does-not-exist1").should("not.exist")
          .get("#does-not-exist2").should("not.exist")
          .get("#does-not-exist3").should("not.exist")

    describe "have.text", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "resolves the assertion", ->
        @cy.get("#list li").eq(0).should("have.text", "li 0").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

    describe "have.length", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "allows valid string numbers", ->
        length = @cy.$("button").length

        @cy.get("button").should("have.length", ""+length)

      it "throws when should('have.length') isnt a number", (done) ->
        @allowErrors()

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "You must provide a valid number to a length assertion. You passed: 'asdf'"
          done()

        @cy.get("button").should("have.length", "asdf")

      it "does not log extra commands on fail and properly fails command + assertions", (done) ->
        @allowErrors()

        logs = []

        @Cypress.on "log", (log) ->
          logs.push log

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(5)

          expect(logs[2].get("name")).to.eq("get")
          expect(logs[2].get("state")).to.eq("failed")
          expect(logs[2].get("error")).to.eq(err)

          expect(logs[3].get("name")).to.eq("assert")
          expect(logs[3].get("state")).to.eq("failed")
          expect(logs[3].get("error").name).to.eq("AssertionError")

          done()

        @cy
          .root().should("exist")
          .get("button").should("have.length", "asdf")

      it "finishes failed assertions and does not log extra commands when cy.contains fails", (done) ->
        @allowErrors()

        logs = []

        @Cypress.on "log", (log) ->
          logs.push log

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(2)

          expect(logs[0].get("name")).to.eq("contains")
          expect(logs[0].get("state")).to.eq("failed")
          expect(logs[0].get("error")).to.eq(err)

          expect(logs[1].get("name")).to.eq("assert")
          expect(logs[1].get("state")).to.eq("failed")
          expect(logs[1].get("error").name).to.eq("AssertionError")

          done()

        @cy.contains("Nested Find").should("have.length", 2)

    describe "have.class", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "snapshots and ends the assertion after retrying", ->
        @cy.on "retry", _.after 3, =>
          @cy.$("#specific-contains span:first").addClass("active")

        @cy.contains("foo").should("have.class", "active").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("snapshot")).to.be.an("object")

      it "retries assertion until true", ->
        button = @cy.$("button:first")

        retry = _.after 3, ->
          button.addClass("new-class")

        @cy.on "retry", retry

        @cy.get("button:first").should("have.class", "new-class")

    describe "errors", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(200)

      it "should not be true", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "expected false to be true"
          done()

        @cy.noop(false).should("be.true")

      it "throws err when not available chainable", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "The chainer: 'dee' was not found. Could not build assertion."
          done()

        @cy.noop({}).should("dee.eq", {})

      it "throws err when ends with a non available chainable", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "The chainer: 'eq2' was not found. Could not build assertion."
          done()

        @cy.noop({}).should("deep.eq2", {})

      it "logs 'should' when non avaiable chainer", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(logs.length).to.eq(2)
          expect(@log.get("name")).to.eq("should")
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("snapshot")).to.be.an("object")
          expect(@log.get("message")).to.eq("not.contain2, does-not-exist-foo-bar")
          done()

        @cy.get("div:first").should("not.contain2", "does-not-exist-foo-bar")

      it "throws when eventually times out", (done) ->
        @cy._timeout(200)

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Timed out retrying: expected '<button#button>' to have class 'does-not-have-class'"
          done()

        @cy.get("button:first").should("have.class", "does-not-have-class")

      it "throws when the subject isnt in the DOM", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.$("button:first").click ->
          $(@).addClass("foo").remove()

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include "Cannot call .should() because the current subject has been removed or detached from the DOM."
          # expect(logs.length).to.eq(3)
          # expect(@log.get("name")).to.eq("should")
          # expect(@log.get("error")).to.eq(err)
          # expect(@log.get("state")).to.eq("failed")
          # expect(@log.get("snapshot")).to.be.an("object")
          # expect(@log.get("message")).to.eq("have.class, foo")
          done()

        @cy.get("button:first").click().should("have.class", "foo").then ->
          done("cy.should was supposed to fail")

      it "throws when the subject eventually isnt in the DOM", (done) ->
        button = @cy.$("button:first")

        @cy.on "retry", _.after 2, _.once ->
          button.addClass("foo").remove()

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Cannot call .should() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get("button:first").click().should("have.class", "foo").then ->
          done("cy.should was supposed to fail")

      it "throws when should('have.length') isnt a number", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        ## we specifically turn off logging have.length validation errors
        ## because the assertion will already be logged
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(logs.length).to.eq(3)
          expect(err.message).to.eq "You must provide a valid number to a length assertion. You passed: 'foo'"
          expect(@log.get("name")).to.eq("should")
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("snapshot")).to.be.an("object")
          expect(@log.get("message")).to.eq("have.length, foo")
          done()

        @cy.get("button").should("have.length", "foo")

      it "eventually.have.length is deprecated", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(logs.length).to.eq(2)
          expect(err.message).to.eq "The 'eventually' assertion chainer has been deprecated. This is now the default behavior so you can safely remove this word and everything should work as before."
          expect(@log.get("name")).to.eq("should")
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("snapshot")).to.be.an("object")
          expect(@log.get("message")).to.eq("eventually.have.length, 1")
          done()

        @cy.get("div:first").should("eventually.have.length", 1)

      it "does not additionally log when .should is the current command", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(logs.length).to.eq(1)
          expect(@log.get("name")).to.eq("should")
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("snapshot")).to.be.an("object")
          expect(@log.get("message")).to.eq("deep.eq2, {}")

          done()

        @cy.noop({}).should("deep.eq2", {})

      it "logs and immediately fails on custom match assertions", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(logs.length).to.eq(2)
          expect(err.message).to.eq "'match' requires its argument be a 'RegExp'. You passed: 'foo'"
          expect(@log.get("name")).to.eq("should")
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("snapshot")).to.be.an("object")
          expect(@log.get("message")).to.eq("match, foo")
          done()

        @cy.wrap("foo").should("match", "foo")

      it "does not log ensureElExistance errors", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(logs.length).to.eq(1)
          done()

        @cy.get("#does-not-exist")

  context "#and", ->
    it "proxies to #should", ->
      @cy.noop({foo: "bar"}).should("have.property", "foo").and("eq", "bar")

  context "#assert", ->
    before ->
      @onAssert = (fn) =>
        @Cypress.on "log", (obj) =>
          if obj.get("name") is "assert"
            ## restore so we dont create an endless loop
            ## due to Cypress.assert being called again
            @chai.restore()
            fn.call(@, obj)

    beforeEach ->
      @chai = $Cypress.Chai.create(@Cypress, {})

    afterEach ->
      @chai.restore()

    it "has custom onFail on err", (done) ->
      @allowErrors()

      @onAssert (log) ->
        expect(log.get("error").onFail).to.be.a("function")
        done()

      @cy.then ->
        expect(true).to.be.false

    it "does not output should logs on failures", (done) ->
      @allowErrors()

      logs = []

      @Cypress.on "log", (log) ->
        logs.push log

      @cy.on "fail", =>
        @chai.restore()
        expect(logs).to.have.length(1)
        done()

      @cy.noop({}).should("have.property", "foo")

    it "ends immediately", (done) ->
      @onAssert (log) ->
        expect(log.get("end")).to.be.true
        expect(log.get("state")).to.eq("passed")
        done()

      @cy.get("body").then ->
        expect(@cy.prop("subject")).to.match "body"

    it "snapshots immediately", (done) ->
      @onAssert (log) ->
        expect(log.get("snapshot")).to.be.an("object")
        done()

      @cy.get("body").then ->
        expect(@cy.prop("subject")).to.match "body"

    it "sets type to child when assertion involved current subject", (done) ->
      @onAssert (log) ->
        expect(log.get("type")).to.eq "child"
        done()

      @cy.get("body").then ->
        expect(@cy.prop("subject")).to.match "body"

    it "sets type to child current command had arguments but does not match subject", (done) ->
      @onAssert (log) ->
        expect(log.get("type")).to.eq "child"
        done()

      @cy.get("body").then ($body) ->
        expect($body.length).to.eq(1)

    it "sets type to parent when assertion did not involve current subject and didnt have arguments", (done) ->
      @onAssert (log) ->
        expect(log.get("type")).to.eq "parent"
        done()

      @cy.get("body").then ->
        expect(true).to.be.true

    it "replaces instances of word: 'but' with 'and' for passing assertion", (done) ->
      ## chai jquery adds 2 assertions here so
      ## we bind to the 2nd one
      @Cypress.on "log", (log) ->
        if log.get("name") is "assert"
          assert(log)

      assert = _.after 2, (obj) =>
        @chai.restore()

        expect(obj.get("message")).to.eq "expected [b]<a>[\\b] to have a [b]href[\\b] attribute with the value [b]#[\\b], and the value was [b]#[\\b]"
        done()

      @cy.get("a").then ($a) ->
        expect($a).to.have.attr "href", "#"

    it "does not replaces instances of word: 'but' with 'and' for failing assertion", (done) ->
      @allowErrors()

      ## chai jquery adds 2 assertions here so
      ## we bind to the 2nd one
      @Cypress.on "log", (obj) ->
        if obj.get("name") is "assert"
          assert(obj)

      assert = _.after 2, (obj) =>
        @chai.restore()
        expect(obj.get("message")).to.eq "expected [b]<a>[\\b] to have a [b]href[\\b] attribute with the value [b]asdf[\\b], but the value was [b]#[\\b]"
        done()

      @cy.get("a").then ($a) ->
        expect($a).to.have.attr "href", "asdf"

    it "does not replace 'button' with 'andton'", (done) ->
      ## chai jquery adds 2 assertions here so
      ## we bind to the 2nd one
      @Cypress.on "log", (obj) ->
        if obj.get("name") is "assert"
          assert(obj)

      assert = _.after 1, (obj) =>
        @chai.restore()

        expect(obj.get("message")).to.eq "expected [b]<button#button>[\\b] to be visible"
        done()

      @cy.get("#button").then ($button) ->
        expect($button).to.be.visible

    it "#onConsole for regular objects", (done) ->
      @onAssert (obj) ->
        expect(obj.attributes.onConsole()).to.deep.eq {
          Command: "assert"
          expected: 1
          actual: 1
          Message: "expected 1 to equal 1"
        }
        done()

      @cy
        .then ->
          expect(1).to.eq 1

    it "#onConsole for DOM objects", (done) ->
      @onAssert (obj) ->
        expect(obj.attributes.onConsole()).to.deep.eq {
          Command: "assert"
          subject: getFirstSubjectByName.call(@, "get")
          Message: "expected <body> to match body"
        }
        done()

      @cy
        .get("body").then ($body) ->
          expect($body).to.match "body"

    it "#onConsole for errors", (done) ->
      @allowErrors()

      @onAssert (obj) ->
        expect(obj.attributes.onConsole()).to.deep.eq {
          Command: "assert"
          expected: false
          actual: true
          Message: "expected true to be false"
          Error: obj.get("error").stack
        }
        done()

      @cy.then ->
        expect(true).to.be.false

    describe "#patchAssert", ->
      it "wraps \#{this} and \#{exp} in \#{b}", (done) ->
        @onAssert (obj) ->
          expect(obj.get("message")).to.eq "expected [b]foo[\\b] to equal [b]foo[\\b]"
          done()

        @cy.then ->
          expect("foo").to.eq "foo"

      it "doesnt mutate error message", ->
        @cy.then ->
          try
            expect(true).to.eq false
          catch e
            expect(e.message).to.eq "expected true to equal false"

      describe "jQuery elements", ->
        it "sets _obj to selector", (done) ->
          @onAssert (obj) ->
            expect(obj.get("message")).to.eq "expected [b]<body>[\\b] to exist in the DOM"
            done()

          @cy.get("body").then ($body) ->
            expect($body).to.exist

        describe "without selector", ->
          it "exists", (done) ->
            @onAssert (obj) ->
              expect(obj.get("message")).to.eq "expected [b]<div>[\\b] to exist in the DOM"
              done()

            ## prepend an empty div so it has no id or class
            @cy.$("body").prepend $("<div />")

            @cy.get("div").eq(0).then ($div) ->
              # expect($div).to.match("div")
              expect($div).to.exist

          it "uses element name", (done) ->
            @onAssert (obj) ->
              expect(obj.get("message")).to.eq "expected [b]<input>[\\b] to match [b]input[\\b]"
              done()

            ## prepend an empty div so it has no id or class
            @cy.$("body").prepend $("<input />")

            @cy.get("input").eq(0).then ($div) ->
              expect($div).to.match("input")

        describe "property assertions", ->
          it "has property", (done) ->
            @onAssert (obj) ->
              expect(obj.get("message")).to.eq "expected [b]<form#by-id>[\\b] to have a property [b]length[\\b]"
              done()

            @cy.get("form").should("have.property", "length")

    describe "#expect", ->
      it "proxies to chai.expect", ->
        exp = @sandbox.spy chai, "expect"
        $Cypress.Chai.expect(true).to.eq.true

        expectOriginal(exp).to.be.calledWith(true)

  context "chai overrides", ->
    before ->
      @onAssert = (fn) =>
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            ## restore so we dont create an endless loop
            ## due to Cypress.assert being called again
            @chai.restore()
            fn.call(@, log)

    beforeEach ->
      @chai = $Cypress.Chai.create(@Cypress, {})

    afterEach ->
      @chai.restore()

    describe "#contain", ->
      it "can find input type submit by value", ->
        @cy.get("#input-type-submit").should("contain", "click me")

      it "is true when element contains text", ->
        @cy.get("#nested-find").should("contain", "Nested Find")

      it "is true when submit input contains value", ->
        @cy.get("input[type=submit]:first").should("contain", "input contains submit")

      it "calls super when not DOM element", ->
        @cy.noop("foobar").should("contain", "oob")

    describe "#match", ->
      it "calls super when provided a regex", ->
        expect("foo").to.match(/foo/)

      it "throws when not provided a regex", ->
        fn = ->
          expect("foo").to.match("foo")

        expect(fn).to.throw("'match' requires its argument be a 'RegExp'. You passed: 'foo'")

      it "throws with cy.should", (done) ->
        @allowErrors()

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "'match' requires its argument be a 'RegExp'. You passed: 'bar'"
          done()

        @cy.noop("foo").should("match", "bar")

      it "can restore match to original fn", ->
        fn = ->
          expect("foo").to.match("foo")

        @chai.restore()
        expect(fn).to.throw("re.exec is not a function")

      it "does not affect DOM element matching", ->
        @cy.get("body").should("match", "body")

    describe "#exist", ->
      it "uses $el.selector in expectation", (done) ->
        @onAssert (log) ->
          expect(log.get("message")).to.eq("expected [b]#does-not-exist[\\b] not to exist in the DOM")
          done()

        @cy.get("#does-not-exist").should("not.exist")

    describe "#be.visible", ->
      it "sets type to child", (done) ->
        @onAssert (log) ->
          expect(log.get("type")).to.eq("child")
          done()

        cy
          .get("body")
          .get("#nested-find").should("be.visible")

    describe "#have.length", ->
      it "formats _obj with cypress", (done) ->
        @onAssert (log) ->
          expect(log.get("message")).to.eq("expected [b]<button#button>[\\b] to have a length of [b]1[\\b] and got [b]1[\\b]")
          done()

        @cy.get("button:first").should("have.length", 1)

      it "formats error _obj with cypress", (done) ->
        @onAssert (log) ->
          expect(log.get("_error").message).to.eq("expected '<body>' to have a length of 2 but got 1")
          done()

        @cy.get("body").should("have.length", 2)

      it "does not touch non DOM objects", ->
        @cy.noop([1,2,3]).should("have.length", 3)

      it "rejects any element not in the document", ->
        buttons = @cy.$("button")

        length = buttons.length

        @cy.on "retry", _.after 2, =>
          @cy.$("button:last").remove()

        @cy.wrap(buttons).should("have.length", length - 1)
# describe "$Cypress.Cy Assertion Commands", ->
#   enterCommandTestingMode()

#   context "#should", ->
#     it "returns the subject for chainability", ->
#       @cy.noop({foo: "bar"}).should("deep.eq", {foo: "bar"}).then (obj) ->
#         expect(obj).to.deep.eq {foo: "bar"}

#     it "can use negation", ->
#       @cy.noop(false).should("not.be.true")

#     it "works with jquery chai", ->
#       div = $("<div class='foo'>asdf</div>")

#       @cy.$("body").append(div)

#       @cy
#         .get("div.foo").should("have.class", "foo").then ($div) ->
#           expect($div).to.match div
#           $div.remove()

#     it "can chain multiple assertions", ->
#       @cy
#         .get("body")
#           .should("contain", "DOM Fixture")
#           .should("have.property", "length", 1)

#     it "can change the subject", ->
#       @cy.get("input:first").should("have.property", "length").should("eq", 1).then (num) ->
#         expect(num).to.eq(1)

#     it "changes the subject with chai-jquery", ->
#       @cy.get("input:first").should("have.attr", "id").should("eq", "input")

#     it "changes the subject with JSON", ->
#       obj = {requestJSON: {teamIds: [2]}}
#       @cy.noop(obj).its("requestJSON").should("have.property", "teamIds").should("deep.eq", [2])

#     describe "not.exist", ->
#       beforeEach ->
#         @chai = $Cypress.Chai.create(@Cypress, {})

#       afterEach ->
#         @chai.restore()

#       it "does not throw when subject leaves dom", ->
#         @cy.$("button:first").click ->
#           $(@).remove()

#         @cy.get("button:first").click().should("not.exist")

#       it "throws when the subject eventually isnt in the DOM", ->
#         button = @cy.$("button:first")

#         @cy.on "retry", _.after 2, _.once ->
#           button.remove()

#         @cy.get("button:first").click().should("eventually.not.exist")

#     describe "eventually chainer", ->
#       it "retries assertion until true", ->
#         button = @cy.$("button:first")

#         retry = _.after 3, ->
#           button.addClass("new-class")

#         @cy.on "retry", retry

#         @cy.get("button:first").should("eventually.have.class", "new-class")

#     describe "errors", ->
#       beforeEach ->
#         @allowErrors()

#       it "should not be true", (done) ->
#         @cy.on "fail", (err) ->
#           expect(err.message).to.eq "expected false to be true"
#           done()

#         @cy.noop(false).should("be.true")

#       it "throws err when not available chaninable", (done) ->
#         @cy.on "fail", (err) ->
#           expect(err.message).to.eq "The chainer: 'dee' was not found. Building implicit assertion failed."
#           done()

#         @cy.noop({}).should("dee.eq", {})

#       it "throws err when ends with a non available chaninable", (done) ->
#         @cy.on "fail", (err) ->
#           expect(err.message).to.eq "The chainer: 'eq2' was not found. Building implicit assertion failed."
#           done()

#         @cy.noop({}).should("deep.eq2", {})

#       it "throws when eventually times out", (done) ->
#         @cy._timeout(200)

#         @cy.on "fail", (err) ->
#           expect(err.message).to.eq "Timed out retrying. AssertionError: expected <button id=\"button\">button</button> to have class 'does-not-have-class'"
#           done()

#         @cy.get("button:first").should("eventually.have.class", "does-not-have-class")

#       it "throws when using eventually and non available chainer", (done) ->
#         @cy.on "fail", (err) ->
#           expect(err.message).to.eq "The chainer: 'eq2' was not found. Building implicit assertion failed."
#           done()

#         @cy.noop({}).should("eventually.deep.eq2", {})

#       it "throws when the subject isnt in the DOM", (done) ->
#         @cy.$("button:first").click ->
#           $(@).addClass("foo").remove()

#         @cy.on "fail", (err) ->
#           expect(err.message).to.eq "Cannot call .should() because the current subject has been removed or detached from the DOM."
#           done()

#         @cy.get("button:first").click().should("have.class", "foo").then ->
#           done("cy.should was supposed to fail")

#       it "throws when the subject eventually isnt in the DOM", (done) ->
#         button = @cy.$("button:first")

#         @cy.on "retry", _.after 2, _.once ->
#           button.addClass("foo").remove()

#         @cy.on "fail", (err) ->
#           expect(err.message).to.eq "Cannot call .should() because the current subject has been removed or detached from the DOM."
#           done()

#         @cy.get("button:first").click().should("eventually.have.class", "foo").then ->
#           done("cy.should was supposed to fail")

#       it "throws when using eventually.have.length", (done) ->
#         @cy.on "fail", (err) ->
#           expect(err.message).to.eq "'eventually.have.length' is NOT a supported assertion. Use the command options: '{length: 3}' implicit assertion instead."
#           done()

#         @cy.get("button:first").should("eventually.have.length", 3)

#       it "thows when using eventually.have.length without providing a number", (done) ->
#         @cy.on "fail", (err) ->
#           expect(err.message).to.eq "'eventually.have.length' is NOT a supported assertion. Use the command options: '{length: n}' implicit assertion instead."
#           done()

#         @cy.get("button:first").should("eventually.have.length")

#   context "#and", ->
#     it "proxies to #should", ->
#       @cy.noop({foo: "bar"}).should("have.property", "foo").and("eq", "bar")

#   context "#assert", ->
#     before ->
#       @onAssert = (fn) =>
#         @Cypress.on "log", (obj) =>
#           if obj.get("name") is "assert"
#             ## restore so we dont create an endless loop
#             ## due to Cypress.assert being called again
#             @chai.restore()
#             fn.call(@, obj)

#     beforeEach ->
#       @chai = $Cypress.Chai.create(@Cypress, {})

#     afterEach ->
#       @chai.restore()

#     it "has custom onFail on err", (done) ->
#       @allowErrors()

#       @onAssert (log) ->
#         expect(log.get("error").onFail).to.be.a("function")
#         done()

#       @cy.then ->
#         expect(true).to.be.false

#     it "does not output should logs on failures", (done) ->
#       @allowErrors()

#       logs = []

#       @Cypress.on "log", (log) ->
#         logs.push log

#       @cy.on "fail", =>
#         @chai.restore()
#         expect(logs).to.have.length(1)
#         done()

#       @cy.noop({}).should("have.property", "foo")

#     it "ends immediately", (done) ->
#       @onAssert (log) ->
#         expect(log.get("end")).to.be.true
#         expect(log.get("state")).to.eq("success")
#         done()

#       @cy.get("body").then ->
#         expect(@cy.prop("subject")).to.match "body"

#     it "snapshots immediately", (done) ->
#       @onAssert (log) ->
#         expect(log.get("snapshot")).to.be.an("object")
#         done()

#       @cy.get("body").then ->
#         expect(@cy.prop("subject")).to.match "body"

#     it "sets type to child when assertion involved current subject", (done) ->
#       @onAssert (log) ->
#         expect(log.get("type")).to.eq "child"
#         done()

#       @cy.get("body").then ->
#         expect(@cy.prop("subject")).to.match "body"

#     it "sets type to child current command had arguments but does not match subject", (done) ->
#       @onAssert (log) ->
#         expect(log.get("type")).to.eq "child"
#         done()

#       @cy.get("body").then ($body) ->
#         expect($body.length).to.eq(1)

#     it "sets type to parent when assertion did not involve current subject and didnt have arguments", (done) ->
#       @onAssert (log) ->
#         expect(log.get("type")).to.eq "parent"
#         done()

#       @cy.get("body").then ->
#         expect(true).to.be.true

#     it "replaces instances of word: 'but' with 'and' for passing assertion", (done) ->
#       ## chai jquery adds 2 assertions here so
#       ## we bind to the 2nd one
#       @Cypress.on "log", (log) ->
#         if log.get("name") is "assert"
#           assert(log)

#       assert = _.after 2, (obj) =>
#         @chai.restore()

#         expect(obj.get("message")).to.eq "expected [b]<a>[\\b] to have a [b]<a>[\\b] attribute with the value [b]#[\\b], and the value was [b]#[\\b]"
#         done()

#       @cy.get("a").then ($a) ->
#         expect($a).to.have.attr "href", "#"

#     it "does not replaces instances of word: 'but' with 'and' for failing assertion", (done) ->
#       @allowErrors()

#       ## chai jquery adds 2 assertions here so
#       ## we bind to the 2nd one
#       @Cypress.on "log", (obj) ->
#         if obj.get("name") is "assert"
#           assert(obj)

#       assert = _.after 2, (obj) =>
#         @chai.restore()
#         expect(obj.get("message")).to.eq "expected [b]<a>[\\b] to have a [b]<a>[\\b] attribute with the value [b]asdf[\\b], but the value was [b]#[\\b]"
#         done()

#       @cy.get("a").then ($a) ->
#         expect($a).to.have.attr "href", "asdf"

#     it "does not replace 'button' with 'andton'", (done) ->
#       ## chai jquery adds 2 assertions here so
#       ## we bind to the 2nd one
#       @Cypress.on "log", (obj) ->
#         if obj.get("name") is "assert"
#           assert(obj)

#       assert = _.after 1, (obj) =>
#         @chai.restore()

#         expect(obj.get("message")).to.eq "expected [b]<button#button>[\\b] to be visible"
#         done()

#       @cy.get("#button").then ($button) ->
#         expect($button).to.be.visible

#     it "#onConsole for regular objects", (done) ->
#       @onAssert (obj) ->
#         expect(obj.attributes.onConsole()).to.deep.eq {
#           Command: "assert"
#           expected: 1
#           actual: 1
#           Message: "expected 1 to equal 1"
#         }
#         done()

#       @cy
#         .then ->
#           expect(1).to.eq 1

#     it "#onConsole for DOM objects", (done) ->
#       @onAssert (obj) ->
#         expect(obj.attributes.onConsole()).to.deep.eq {
#           Command: "assert"
#           subject: getFirstSubjectByName.call(@, "get")
#           Message: "expected <body> to match body"
#         }
#         done()

#       @cy
#         .get("body").then ($body) ->
#           expect($body).to.match "body"

#     it "#onConsole for errors", (done) ->
#       @allowErrors()

#       @onAssert (obj) ->
#         expect(obj.attributes.onConsole()).to.deep.eq {
#           Command: "assert"
#           expected: false
#           actual: true
#           Message: "expected true to be false"
#           Error: obj.get("error").stack
#         }
#         done()

#       @cy.then ->
#         expect(true).to.be.false

#     describe "#patchAssert", ->
#       it "wraps \#{this} and \#{exp} in \#{b}", (done) ->
#         @onAssert (obj) ->
#           expect(obj.get("message")).to.eq "expected [b]foo[\\b] to equal [b]foo[\\b]"
#           done()

#         @cy.then ->
#           expect("foo").to.eq "foo"

#       it "doesnt mutate error message", ->
#         @cy.then ->
#           try
#             expect(true).to.eq false
#           catch e
#             expect(e.message).to.eq "expected true to equal false"

#       describe "jQuery elements", ->
#         it "sets _obj to selector", (done) ->
#           @onAssert (obj) ->
#             expect(obj.get("message")).to.eq "expected [b]<body>[\\b] to exist"
#             done()

#           @cy.get("body").then ($body) ->
#             expect($body).to.exist

#         describe "without selector", ->
#           it "exists", (done) ->
#             @onAssert (obj) ->
#               expect(obj.get("message")).to.eq "expected [b]<div>[\\b] to exist"
#               done()

#             ## prepend an empty div so it has no id or class
#             @cy.$("body").prepend $("<div />")

#             @cy.get("div").eq(0).then ($div) ->
#               # expect($div).to.match("div")
#               expect($div).to.exist

#           it "uses element name", (done) ->
#             @onAssert (obj) ->
#               expect(obj.get("message")).to.eq "expected [b]<input>[\\b] to match [b]input[\\b]"
#               done()

#             ## prepend an empty div so it has no id or class
#             @cy.$("body").prepend $("<input />")

#             @cy.get("input").eq(0).then ($div) ->
#               expect($div).to.match("input")

#         describe "property assertions", ->
#           it "has property", (done) ->
#             @onAssert (obj) ->
#               expect(obj.get("message")).to.eq "expected [b]<form#by-id>[\\b] to have a property [b]length[\\b]"
#               done()

#             @cy.get("form").should("have.property", "length")

#     describe "#expect", ->
#       it "proxies to chai.expect", ->
#         exp = @sandbox.spy chai, "expect"
#         $Cypress.Chai.expect(true).to.eq.true

#         expectOriginal(exp).to.be.calledWith(true)
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

    describe "#eventually.have.length", ->
      it "is deprecated", (done) ->
        @allowErrors()

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "The 'eventually' assertion chainer has been deprecated. This is now the default behavior so you can safely remove this word and everything should work as before."
          done()

        @cy.noop().should("eventually.have.length", 1)
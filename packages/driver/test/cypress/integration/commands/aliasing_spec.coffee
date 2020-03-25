$ = Cypress.$.bind(Cypress)
_ = Cypress._

describe "src/cy/commands/aliasing", ->
  before ->
    cy
      .visit("/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#as", ->
    it "is special utility command", ->
      cy.wrap("foo").as("f").then ->
        cmd = cy.queue.find({name: "as"})
        expect(cmd.get("type")).to.eq("utility")

    it "does not change the subject", ->
      body = cy.$$("body")

      cy.get("body").as("b").then ($body) ->
        expect($body.get(0)).to.eq body.get(0)

    it "stores the lookup as an alias", ->
      cy.get("body").as("b").then ->
        expect(cy.state("aliases").b).to.exist

    it "stores the resulting subject as the alias", ->
      $body = cy.$$("body")

      cy.get("body").as("b").then ->
        expect(cy.state("aliases").b.subject.get(0)).to.eq($body.get(0))

    it "stores subject of chained aliases", ->
      li = cy.$$("#list li").eq(0)

      cy.get("#list li").eq(0).as("firstLi").then ($li) ->
        expect($li).to.match li

    it "retries primitives and assertions", ->
      obj = {}

      cy.on "command:retry", _.after 2, ->
        obj.foo = "bar"

      cy.wrap(obj).as("obj")

      cy.get("@obj").should("deep.eq", { foo: "bar" })

    it "allows dot in alias names", ->
      cy.get("body").as("body.foo").then ->
        expect(cy.state("aliases")['body.foo']).to.exist
        cy.get('@body.foo').should("exist")

    it "recognizes dot and non dot with same alias names", ->
      cy.get("body").as("body").then ->
        expect(cy.state("aliases")['body']).to.exist
        cy.get('@body').should("exist")

      cy.contains("foo").as("body.foo").then ->
        expect(cy.state("aliases")['body.foo']).to.exist
        cy.get('@body.foo').should("exist")
        cy.get('@body.foo').then (bodyFoo) ->
          cy.get('@body').should("not.equal", bodyFoo)

    context "DOM subjects", ->
      it "assigns the remote jquery instance", ->
        obj = {}

        jquery = -> obj

        cy.state("jQuery", jquery)

        cy.get("input:first").as("input").then ($input) ->
          expect(@input).to.eq(obj)

    context "#assign", ->
      beforeEach ->
        cy.noop("foo").as("foo")

      afterEach ->
        if not @foo
          @test.error new Error("this.foo not defined")

      it "assigns subject to runnable ctx", ->
        cy
          .noop({}).as("baz").then (obj) ->
            expect(@baz).to.eq obj

      it "assigns subject with dot to runnable ctx", ->
        cy.noop({}).as("bar.baz").then (obj) ->
          expect(@["bar.baz"]).to.eq obj

      describe "nested hooks", ->
        afterEach ->
          if not @bar
            @test.error new Error("this.bar not defined")

          if not @foo
            @test.error new Error("this.foo not defined")

        it "assigns bar", ->
          cy.noop("bar").as("bar")

      describe "nested functions", ->
        beforeEach ->
          @assign = =>
            cy.noop("quux").as("quux")

        afterEach ->
          if not @quux
            @test.error new Error("this.quux not defined")

        it "shares this ctx with hooks", ->
          @assign().then ->
            expect(@quux).to.eq("quux")

    describe "errors", ->
      it "throws as a parent command", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include("before running a parent command")
          expect(err.message).to.include("`cy.as(\"foo\")`")
          done()

        cy.as("foo")

      _.each [null, undefined, {}, [], 123], (value) =>
        it "throws if when passed: #{value}", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.eq "`cy.as()` can only accept a string."
            expect(err.docsUrl).to.eq "https://on.cypress.io/as"
            done()

          cy.get("div:first").as(value)

      it "throws on blank string", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "`cy.as()` cannot be passed an empty string."
          expect(err.docsUrl).to.eq "https://on.cypress.io/as"
          done()

        cy.get("div:first").as("")

      it "throws on alias starting with @ char", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "`@myAlias` cannot be named starting with the `@` symbol. Try renaming the alias to `myAlias`, or something else that does not start with the `@` symbol."
          expect(err.docsUrl).to.eq "https://on.cypress.io/as"
          done()

        cy.get("div:first").as("@myAlias")

      it "throws on alias starting with @ char and dots", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "`@my.alias` cannot be named starting with the `@` symbol. Try renaming the alias to `my.alias`, or something else that does not start with the `@` symbol."
          expect(err.docsUrl).to.eq "https://on.cypress.io/as"
          done()

        cy.get("div:first").as("@my.alias")

      it "does not throw on alias with @ char in non-starting position", () ->
        cy.get("div:first").as("my@Alias")
        cy.get("@my@Alias")

      _.each ["test", "runnable", "timeout", "slow", "skip", "inspect"], (blacklist) ->
        it "throws on a blacklisted word: #{blacklist}", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.eq "`cy.as()` cannot be aliased as: `#{blacklist}`. This word is reserved."
            expect(err.docsUrl).to.eq "https://on.cypress.io/as"
            done()

          cy.get("div:first").as(blacklist)

    describe "log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "sets aliasType to 'primitive'", ->
        cy.wrap({}).as("obj").then ->
          lastLog = @lastLog

          expect(lastLog.get("aliasType")).to.eq "primitive"
      it "sets aliasType to 'dom'", ->
        cy.get("body").find("button:first").click().as("button").then ->
          lastLog = @lastLog

          expect(lastLog.get("aliasType")).to.eq "dom"

      it "aliases previous command / non event / matching chainerId", ->
        Cypress.Commands.addAll({
          foo: ->
            cmd = Cypress.log({})

            cy.get("ul:first li", {log: false}).first({log: false}).then ($li) ->
              cmd.snapshot().end()
              return undefined
        })

        cy.foo().as("foo").then ->
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("alias")).to.eq("foo")
          expect(lastLog.get("aliasType")).to.eq("dom")

      it "does not match alias when the alias has already been applied", ->
        cy
          .visit("/fixtures/commands.html")
          .server()
          .route(/foo/, {}).as("getFoo")
          .then ->
            ## 1 log from visit
            ## 1 log from route
            expect(@logs.length).to.eq(2)

            expect(@logs[0].get("name")).to.eq("visit")
            expect(@logs[0].get("alias")).not.to.be.ok
            expect(@logs[0].get("aliasType")).not.to.be.ok

            expect(@logs[1].get("name")).to.eq("route")
            expect(@logs[1].get("alias")).to.eq("getFoo")

  context "#replayCommandsFrom", ->
    describe "subject in document", ->
      it "returns if subject is still in the document", ->
        cy
          .get("#list").as("list").then ->
            currentLength = cy.queue.length

            cy.get("@list").then ->
              ## should only add the .get() and the .then()
              expect(cy.queue.length).to.eq(currentLength + 2)

    describe "subject not in document", ->
      it "inserts into the queue", ->
        existingNames = cy.queue.names()

        cy
          .get("#list li").eq(0).as("firstLi").then ($li) ->
            $li.remove()
          .get("@firstLi").then ->
            expect(cy.queue.names()).to.deep.eq(
              existingNames.concat(
                ["get", "eq", "as", "then", "get", "get", "eq", "then"]
              )
            )

      it "replays from last root to current", ->
        first = cy.$$("#list li").eq(0)
        second = cy.$$("#list li").eq(1)

        cy
          .get("#list li").eq(0).as("firstLi").then ($li) ->
            expect($li.get(0)).to.eq first.get(0)
            $li.remove()
          .get("@firstLi").then ($li) ->
            expect($li.get(0)).to.eq second.get(0)

      it "replays up until first root command", ->
        existingNames = cy.queue.names()

        cy
          .get("body").noop({})
          .get("#list li").eq(0).as("firstLi").then ($li) ->
            $li.remove()
          .get("@firstLi").then ->
            expect(cy.queue.names()).to.deep.eq(
              existingNames.concat(
                ["get", "noop", "get", "eq", "as", "then", "get", "get", "eq", "then"]
              )
            )

      it "resets the chainerId allow subjects to be carried on", ->
        cy
          .get("#dom").find("#button").as("button").then ($button) ->
            $button.remove()

            cy.$$("#dom").append $("<button />", id: "button")

            null

        ## when cy is a separate chainer there *was* a bug
        ## that cause the subject to null because of different
        ## chainer id's
        cy.get("@button").then ($button) ->
          expect($button).to.have.id("button")

      it "skips commands which did not change, and starts at the first valid subject or parent command", ->
        existingNames = cy.queue.names()

        cy.$$("#list li").click ->
          ul  = $(@).parent()
          lis = ul.children().clone()

          ## this simulates a re-render
          ul.children().remove()
          ul.append(lis)
          lis.first().remove()

        cy
          .get("#list li")
          .then ($lis) ->
            return $lis
          .as("items")
          .first()
          .click()
          .as("firstItem")
          .then ->
            expect(cy.queue.names()).to.deep.eq(
              existingNames.concat(
                ["get", "then", "as", "first", "click", "as", "then", "get", "should", "then", "get", "should", "then"]
              )
            )
          .get("@items")
          .should("have.length", 2)
          .then ->
            expect(cy.queue.names()).to.deep.eq(
              existingNames.concat(
                ["get", "then", "as", "first", "click", "as", "then", "get", "get", "should", "then", "get", "should", "then"]
              )
            )
          .get("@firstItem")
          .should("contain", "li 1")
          .then ->
            expect(cy.queue.names()).to.deep.eq(
              existingNames.concat(
                ["get", "then", "as", "first", "click", "as", "then", "get", "get", "should", "then", "get", "get", "first", "should", "then"]
              )
            )

      it "inserts assertions", (done) ->
        existingNames = cy.queue.names()

        cy
          .get("#checkboxes input")
          .eq(0)
          .should("be.checked", "cockatoo")
          .as("firstItem")
          .then ($input) ->
            $input.remove()
          .get("@firstItem")
          .then ->
            expect(cy.queue.names()).to.deep.eq(
              existingNames.concat(
                ["get", "eq", "should", "as", "then", "get", "get", "eq", "should", "then"]
              )
            )
            done()

  context "#getAlias", ->
    it "retrieves aliases", ->
      cy
        .get("body").as("b")
        .get("input:first").as("firstInput")
        .get("div:last").as("lastDiv")
        .then ->
          expect(cy.getAlias("@firstInput")).to.exist

    describe "errors", ->
      it "throws when an alias cannot be found", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.get()` could not find a registered alias for: `@lastDiv`.\nAvailable aliases are: `b, firstInput`."
          done()

        cy
          .get("body").as("b")
          .get("input:first").as("firstInput")
          .get("@lastDiv")

      it "throws when alias is missing '@' but matches an available alias", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "Invalid alias: `getAny`.\nYou forgot the `@`. It should be written as: `@getAny`."
          done()

        cy
          .server()
          .route("*", {}).as("getAny")
          .wait("getAny").then ->

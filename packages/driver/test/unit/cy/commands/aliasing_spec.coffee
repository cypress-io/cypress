{ $, _ } = window.testUtils

describe "$Cypress.Cy Aliasing Commands", ->
  enterCommandTestingMode()

  context "#as", ->
    it "does not change the subject", ->
      body = @cy.$$("body")

      @cy.get("body").as("b").then ($body) ->
        expect($body.get(0)).to.eq body.get(0)

    it "stores the lookup as an alias", ->
      @cy.get("body").as("b").then ->
        expect(@cy.state("aliases").b).to.be.defined

    it "stores the resulting subject as the alias", (done) ->
      body = @cy.$$("body")

      @cy.on "end", ->
        expect(@state("aliases").b.subject.get(0)).to.eq body.get(0)
        done()

      @cy.get("body").as("b")

    it "stores subject of chained aliases", ->
      li = @cy.$$("#list li").eq(0)

      @cy.get("#list li").eq(0).as("firstLi").then ($li) ->
        expect($li).to.match li

    context "DOM subjects", ->
      beforeEach ->
        ## set the jquery path back to our
        ## remote window
        @Cypress.option "jQuery", @$iframe.prop("contentWindow").$

        @remoteWindow = @cy.privateState("window")

      afterEach ->
        ## restore back to the global $
        @Cypress.option "jQuery", $

      it "assigns the remote jquery instance", ->
        @remoteWindow.$.fn.foo = fn = ->

        @cy
          .get("input:first").as("input").then ($input) ->
            expect(@input).to.be.instanceof @remoteWindow.$
            expect(@input).to.have.property "foo", fn

    context "#assign", ->
      beforeEach ->
        @cy.noop("foo").as("foo")

      afterEach ->
        if not @foo
          @test.error new Error("this.foo not defined")

        if not @noop
          @test.error new Error("this.noop not defined")

      it "assigns subject to runnable ctx", ->
        @cy
          .noop({}).as("noop").then (obj) ->
            expect(@noop).to.eq obj

      describe "nested hooks", ->
        afterEach ->
          if not @bar
            @test.error new Error("this.bar not defined")

          if not @foo
            @test.error new Error("this.foo not defined")

          if not @noop
            @test.error new Error("this.noop not defined")

        it "assigns bar", ->
          @cy.noop("bar").as("bar")

      describe "nested functions", ->
        beforeEach ->
          @assign = =>
            @cy.noop("baz").as("baz")

        afterEach ->
          if not @baz
            @test.error new Error("this.baz not defined")

        it "shares this ctx with hooks", ->
          @assign().then ->
            expect(@baz).to.eq("baz")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      _.each [null, undefined, {}, [], 123], (value) =>
        it "throws if when passed: #{value}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq "cy.as() can only accept a string."
            done()

          @cy.get("div:first").as(value)

      it "throws on blank string", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.as() cannot be passed an empty string."
          done()

        @cy.get("div:first").as("")

      _.each ["test", "runnable", "timeout", "slow", "skip", "inspect"], (blacklist) ->
        it "throws on a blacklisted word: #{blacklist}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq "cy.as() cannot be aliased as: '#{blacklist}'. This word is reserved."
            done()

          @cy.get("div:first").as(blacklist)

    describe "log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "sets aliasType to 'primitive'", ->
        @cy.wrap({}).as("obj").then ->
          expect(@log.get("aliasType")).to.eq "primitive"

      it "sets aliasType to 'dom'", ->
        @cy.get("body").find("button:first").click().as("button").then ->
          expect(@log.get("aliasType")).to.eq "dom"

      it "aliases previous command / non event / matching chainerId", ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @Cypress.Commands.addAll({
          foo: =>
            cmd = @Cypress.Log.command({})

            @cy.get("ul:first li", {log: false}).first({log: false}).then ($li) ->
              cmd.snapshot().end()
              return undefined
        })

        @cy.foo().as("foo").then ->
          expect(logs.length).to.eq(1)
          expect(@log.get("alias")).to.eq("foo")
          expect(@log.get("aliasType")).to.eq("dom")

      it "does not match alias when the alias has already been applied", ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy
          .visit("http://localhost:3500/fixtures/commands.html")
          .server()
          .route(/foo/, {}).as("getFoo")
          .then ->
            ## 1 log from visit
            ## 1 log from route
            expect(logs.length).to.eq(2)

            expect(logs[0].get("name")).to.eq("visit")
            expect(logs[0].get("alias")).not.to.be.ok
            expect(logs[0].get("aliasType")).not.to.be.ok

            expect(logs[1].get("name")).to.eq("route")
            expect(logs[1].get("alias")).to.eq("getFoo")

      # it "does not alias previous logs when no matching chainerId", ->
      #   @cy
      #     .get("div:first")
      #     .noop({}).as("foo").then ->
      #       debugger

  context "#_replayFrom", ->
    describe "subject in document", ->
      it "returns if subject is still in the document", (done) ->
        @cy.on "end", ->
          expect(@queue.length).to.eq 3
          done()

        @cy
          .get("#list").as("list")
          .get("@list")

    describe "subject not in document", ->
      it "inserts into the queue", (done) ->
        @cy
          .get("#list li").eq(0).as("firstLi").then ($li) ->
            $li.remove()
          .get("@firstLi").then ->
            expect(@cy.queue.names()).to.deep.eq(
              ["get", "eq", "as", "then", "get", "get", "eq", "then"]
            )
            done()

      it "replays from last root to current", ->
        first = @cy.$$("#list li").eq(0)
        second = @cy.$$("#list li").eq(1)

        @cy
          .get("#list li").eq(0).as("firstLi").then ($li) ->
            expect($li.get(0)).to.eq first.get(0)
            $li.remove()
          .get("@firstLi").then ($li) ->
            expect($li.get(0)).to.eq second.get(0)

      it "replays up until first root command", (done) ->
        @cy.on "end", ->
          expect(@queue.names()).to.deep.eq(
            ["get", "noop", "get", "eq", "as", "then", "get", "get", "eq"]
          )
          done()

        @cy
          .get("body").noop({})
          .get("#list li").eq(0).as("firstLi").then ($li) ->
            $li.remove()
          .get("@firstLi")

      it "resets the chainerId allow subjects to be carried on", ->
        @cy
          .get("#dom").find("#button").as("button").then ($button) ->
            $button.remove()

            @cy.$$("#dom").append $("<button />", id: "button")

            null

        ## when @cy is a separate chainer there *was* a bug
        ## that cause the subject to null because of different
        ## chainer id's
        @cy.get("@button").then ($button) ->
          expect($button).to.have.id("button")

      it "skips commands which did not change, and starts at the first valid subject or parent command", (done) ->
        @cy.$$("#list li").click ->
          ul  = $(@).parent()
          lis = ul.children().clone()

          ## this simulates a re-render
          ul.children().remove()
          ul.append(lis)
          lis.first().remove()

        @cy
          .get("#list li")
          .then ($lis) ->
            return $lis
          .as("items")
          .first()
          .click()
          .as("firstItem")
          .then ->
            expect(@cy.queue.names()).to.deep.eq(
              ["get", "then", "as", "first", "click", "as", "then", "get", "should", "then", "get", "should", "then"]
            )
          .get("@items")
          .should("have.length", 2)
          .then ->
            expect(@cy.queue.names()).to.deep.eq(
              ["get", "then", "as", "first", "click", "as", "then", "get", "get", "should", "then", "get", "should", "then"]
            )
          .get("@firstItem")
          .should("contain", "li 1")
          .then ->
            expect(@cy.queue.names()).to.deep.eq(
              ["get", "then", "as", "first", "click", "as", "then", "get", "get", "should", "then", "get", "get", "first", "should", "then"]
            )
            done()

      it "inserts assertions", (done) ->
        @cy
          .get("#checkboxes input")
          .eq(0)
          .should("be.checked", "cockatoo")
          .as("firstItem")
          .then ($input) ->
            $input.remove()
          .get("@firstItem")
          .then ->
            expect(@cy.queue.names()).to.deep.eq(
              ["get", "eq", "should", "as", "then", "get", "get", "eq", "should", "then"]
            )
            done()

  context "#getAlias", ->
    it "retrieves aliases", ->
      @cy.on "end", ->
        expect(@getAlias("@firstInput")).to.be.defined

      @cy
        .get("body").as("b")
        .get("input:first").as("firstInput")
        .get("div:last").as("lastDiv")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when an alias cannot be found", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.get() could not find a registered alias for: '@lastDiv'.\nAvailable aliases are: 'b, firstInput'."
          done()

        @cy
          .get("body").as("b")
          .get("input:first").as("firstInput")
          .get("@lastDiv")

      it "throws when alias is missing '@' but matches an available alias", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Invalid alias: 'getAny'.\nYou forgot the '@'. It should be written as: '@getAny'."
          done()

        @cy
          .server()
          .route("*", {}).as("getAny")
          .wait("getAny").then ->

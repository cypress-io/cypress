{ $, _ } = window.testUtils

describe "$Cypress.Cy Miscellaneous Commands", ->
  enterCommandTestingMode()

  context "#hover", ->
    beforeEach ->
      @allowErrors()

    it "throws when invoking", (done) ->
      @cy.on "fail", (err) ->
        expect(err.message).to.include "cy.hover() is not currently implemented."
        expect(err.message).to.include "https://on.cypress.io/hover"
        done()

      @cy.get("button").hover()

  context "#trigger", ->
    it "sends event", (done) ->
      btn = @cy.$$("#button")

      coords = @cy.getCoordinates(btn)

      btn.get(0).addEventListener "mouseover", (e) =>
        obj = _.pick(e, "bubbles", "cancelable", "clientX", "clientY", "target", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          clientX: coords.x - @cy.privateState("window").pageXOffset
          clientY: coords.y - @cy.privateState("window").pageYOffset
          target: btn.get(0)
          type: "mouseover"
        }
        done()

      @cy.get("#button").ttrigger("mouseover")

    it "bubbles up event by default", (done) ->
      mouseover = (e) =>
        @cy.privateState("window").removeEventListener "mouseover", mouseover
        done()

      @cy.privateState("window").addEventListener "mouseover", mouseover

      @cy.get("#button").ttrigger("mouseover")

    it "does not bubble up event if specified", (done) ->
      mouseover = (e) =>
        @cy.privateState("window").removeEventListener "mouseover", mouseover
        done("Should not have bubbled to window listener")

      @cy.privateState("window").addEventListener "mouseover", mouseover

      @cy.get("#button").ttrigger("mouseover", {bubbles: false})

      setTimeout ->
        @cy.privateState("window").removeEventListener "mouseover", mouseover
        done()
      , 500

    it "sends through event options, overriding defaults", (done) ->
      options = {
        clientX: 42
        clientY: 24
        pageX: 420
        pageY: 240
        foo: "foo"
      }

      @cy.$$("button:first").get(0).addEventListener "mouseover", (e) =>
        eventOptions = _.pick(e, "clientX", "clientY", "pageX", "pageY", "foo")
        ## options gets mutated by the command :(
        options = _.pick(options, "clientX", "clientY", "pageX", "pageY", "foo")
        expect(eventOptions).to.eql(options)
        done()

      @cy.get("button:first").ttrigger("mouseover", options)

    it "records correct clientX when el scrolled", (done) ->
      btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo @cy.$$("body")

      coords = @cy.getCoordinates(btn)

      win = @cy.privateState("window")

      btn.get(0).addEventListener "mouseover", (e) =>
        expect(win.pageXOffset).to.be.gt(0)
        expect(e.clientX).to.eq coords.x - win.pageXOffset
        done()

      @cy.get("#scrolledBtn").ttrigger("mouseover")

    it "records correct clientY when el scrolled", (done) ->
      btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo @cy.$$("body")

      coords = @cy.getCoordinates(btn)

      win = @cy.privateState("window")

      btn.get(0).addEventListener "mouseover", (e) =>
        expect(win.pageYOffset).to.be.gt(0)
        expect(e.clientY).to.eq coords.y - win.pageYOffset
        done()

      @cy.get("#scrolledBtn").ttrigger("mouseover")

    it "waits until element becomes visible", ->
      btn = cy.$$("#button").hide()

      retried = false

      @cy.on "retry", _.after 3, ->
        btn.show()
        retried = true

      @cy.get("#button").ttrigger("mouseover").then ->
        expect(retried).to.be.true

    it "waits until element is no longer disabled", ->
      btn = cy.$$("#button").prop("disabled", true)

      retried = false
      mouseovers = 0

      btn.on "mouseover", ->
        mouseovers += 1

      @cy.on "retry", _.after 3, ->
        btn.prop("disabled", false)
        retried = true

      @cy.get("#button").ttrigger("mouseover").then ->
        expect(mouseovers).to.eq(1)
        expect(retried).to.be.true

    it "waits until element stops animating", (done) ->
      retries = []
      mouseovers  = 0

      p = $("<p class='slidein'>sliding in</p>")
      p.on "mouseover", -> mouseovers += 1
      p.css("animation-duration", ".5s")

      @cy.on "retry", (obj) ->
        expect(mouseovers).to.eq(0)
        retries.push(obj)

      p.on "animationstart", =>
        t = Date.now()
        _.delay =>
          @cy.get(".slidein").ttrigger("mouseover").then ->
            expect(retries.length).to.be.gt(5)
            done()
        , 100

      @cy.$$("#animation-container").append(p)

    it "does not throw when waiting for animations is disabled", ->
      @sandbox.stub(@Cypress, "config").withArgs("waitForAnimations").returns(false)

      @cy._timeout(100)

      p = $("<p class='slidein'>sliding in</p>")
      p.css("animation-duration", ".5s")

      @cy.$$("#animation-container").append(p)

      @cy.get(".slidein").ttrigger("mouseover")

    it "does not throw when turning off waitForAnimations in options", ->
      @cy._timeout(100)

      p = $("<p class='slidein'>sliding in</p>")
      p.css("animation-duration", ".5s")

      @cy.$$("#animation-container").append(p)

      @cy.get(".slidein").ttrigger("mouseover", {waitForAnimations: false})

    it "does not throw when setting animationDistanceThreshold extremely high in options", ->
      @cy._timeout(100)

      p = $("<p class='slidein'>sliding in</p>")
      p.css("animation-duration", ".5s")

      @cy.$$("#animation-container").append(p)

      @cy.get(".slidein").ttrigger("mouseover", {animationDistanceThreshold: 1000})

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @cy._timeout(200)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (attrs, log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.$$("button:first").on "mouseover", ->
          _.delay =>
            $(@).addClass("moused-over")
          , 50
          return false

        @cy.get("button:first").ttrigger("mouseover").should("have.class", "moused-over").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get("button:first").ttrigger("mouseover").should("have.class", "moused-over")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get("button:first").ttrigger("mouseover").should("have.class", "moused-over")

    describe "position argument", ->
      it "can trigger event on center by default", (done) ->
        button = @cy.$$("<button />").css({width:200,height:100}).prependTo(@cy.$$("body"))
        onMouseover = (e) ->
          button.off("mouseover", onMouseover)
          expect(e.clientX).to.equal(108)
          expect(e.clientY).to.equal(50)
          done()
        button.on("mouseover", onMouseover)

        @cy.get("button:first").ttrigger("mouseover")

      it "can trigger event on center", (done) ->
        button = @cy.$$("<button />").css({width:200,height:100}).prependTo(@cy.$$("body"))
        onMouseover = (e) ->
          button.off("mouseover", onMouseover)
          expect(e.clientX).to.equal(108)
          expect(e.clientY).to.equal(50)
          done()
        button.on("mouseover", onMouseover)

        @cy.get("button:first").ttrigger("mouseover", "center")

      it "can trigger event on topLeft", (done) ->
        button = @cy.$$("<button />").css({width:200,height:100}).prependTo(@cy.$$("body"))
        onMouseover = (e) ->
          button.off("mouseover", onMouseover)
          expect(e.clientX).to.equal(8)
          expect(e.clientY).to.equal(0)
          done()
        button.on("mouseover", onMouseover)

        @cy.get("button:first").ttrigger("mouseover", "topLeft")

      it "can trigger event on topRight", (done) ->
        button = @cy.$$("<button />").css({width:200,height:100}).prependTo(@cy.$$("body"))
        onMouseover = (e) ->
          button.off("mouseover", onMouseover)
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(0)
          done()
        button.on("mouseover", onMouseover)

        @cy.get("button:first").ttrigger("mouseover", "topRight")

      it "can trigger event on bottomLeft", (done) ->
        button = @cy.$$("<button />").css({width:200,height:100}).prependTo(@cy.$$("body"))
        onMouseover = (e) ->
          button.off("mouseover", onMouseover)
          expect(e.clientX).to.equal(8)
          expect(e.clientY).to.equal(99)
          done()
        button.on("mouseover", onMouseover)

        @cy.get("button:first").ttrigger("mouseover", "bottomLeft")

      it "can trigger event on bottomRight", (done) ->
        button = @cy.$$("<button />").css({width:200,height:100}).prependTo(@cy.$$("body"))
        onMouseover = (e) ->
          button.off("mouseover", onMouseover)
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(99)
          done()
        button.on("mouseover", onMouseover)

        @cy.get("button:first").ttrigger("mouseover", "bottomRight")

      it "can pass options along with position", (done) ->
        button = @cy.$$("<button />").css({width:200,height:100}).prependTo(@cy.$$("body"))
        onMouseover = (e) ->
          button.off("mouseover", onMouseover)
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(99)
          done()
        button.on("mouseover", onMouseover)

        @cy.get("button:first").ttrigger("mouseover", "bottomRight", {bubbles: false})

    describe "relative coordinate arguments", ->
      it "can specify x and y", (done) ->
        button = @cy.$$("<button />").css({width:200,height:100}).prependTo(@cy.$$("body"))
        onMouseover = (e) ->
          button.off("mouseover", onMouseover)
          expect(e.clientX).to.equal(83)
          expect(e.clientY).to.equal(78)
          done()
        button.on("mouseover", onMouseover)

        @cy.get("button:first").ttrigger("mouseover", 75, 78)

      it "can pass options along with x, y", (done) ->
        button = @cy.$$("<button />").css({width:200,height:100}).prependTo(@cy.$$("body"))
        onMouseover = (e) ->
          button.off("mouseover", onMouseover)
          expect(e.clientX).to.equal(83)
          expect(e.clientY).to.equal(78)
          done()
        button.on("mouseover", onMouseover)

        @cy.get("button:first").ttrigger("mouseover", 75, 78, {bubbles: false})

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when eventName is not a string", ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.trigger() can only be called on a single element. Your subject contained 14 elements."
          done()

        @cy.get("button:first").ttrigger("cy.trigger() must be passed a non-empty string as its 1st argument. You passed: 'undefined'.")

      it "throws when not a dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.ttrigger("mouseover")

      it "throws when attempting to trigger multiple elements", (done) ->
        num = @cy.$$("button").length

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.trigger() can only be called on a single element. Your subject contained 14 elements."
          done()

        @cy.get("button").ttrigger("mouseover")

      it "throws when subject is not in the document", (done) ->
        clicked = 0

        checkbox = @cy.$$(":checkbox:first").on "mouseover", (e) ->
          clicked += 1
          checkbox.remove()
          return false

        @cy.on "fail", (err) ->
          expect(clicked).to.eq 1
          expect(err.message).to.include "cy.ttrigger() failed because this element"
          done()

        @cy.get(":checkbox:first").ttrigger("mouseover").ttrigger("mouseover")

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.ttrigger("mouseover")

      it "throws when the subject isnt visible", (done) ->
        btn = @cy.$$("#button:first").hide()

        node = $Cypress.utils.stringifyElement(btn)

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.ttrigger() failed because this element is not visible"
          done()

        @cy.get("button:first").ttrigger("mouseover")

      it "throws when subject is disabled", (done) ->
        btn = @cy.$$("#button").prop("disabled", true)

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          ## get + click logs
          expect(logs.length).eq(2)
          expect(err.message).to.include("cy.ttrigger() failed because this element is disabled:\n")
          done()

        @cy.get("#button").ttrigger("mouseover")

      it "throws when provided invalid position", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(2)
          expect(err.message).to.eq "Invalid position argument: 'foo'. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight."
          done()

        @cy.get("button:first").ttrigger("mouseover", "foo")

      ## FIXME: change to unit test that doesn't rely on real animation
      ## write one test that integration tests animations
      it.skip "throws when element animation exceeds timeout", (done) ->
        @cy._timeout(100)

        mouseovers = 0

        p = $("<p class='slidein'>sliding in</p>")
        p.css("animation-duration", ".5s")
        p.on "mouseover", -> mouseovers += 1

        @cy.on "fail", (err) ->
          expect(mouseovers).to.eq(0)
          expect(err.message).to.include("cy.ttrigger() could not be issued because this element is currently animating:\n")
          done()

        p.on "animationstart", =>
          @cy.get(".slidein").ttrigger("mouseover", {interval: 50, animationDistanceThreshold: 0})

        @cy.$$("#animation-container").append(p)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately before resolving", (done) ->
        button = @cy.$$("button:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "ttrigger"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        @cy.get("button:first").ttrigger("mouseover")

      it "snapshots before triggering", (done) ->
        @cy.$$("button:first").on "mouseover", =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].body).to.be.an("object")
          done()

        @cy.get("button:first").ttrigger("mouseover")

      it "snapshots after triggering", ->
        @cy.get("button:first").ttrigger("mouseover").then ($button) ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].body).to.be.an("object")

      it "returns only the $el for the element of the subject that was triggered", ->
        clicks = []

        ## append two buttons
        button = -> $("<button class='clicks'>click</button>")
        @cy.$$("body").append(button()).append(button())

        @Cypress.on "log", (attrs, log) ->
          clicks.push(log) if log.get("name") is "click"

        @cy.get("button.clicks").click({multiple: true}).then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(clicks.length).to.eq(2)
          expect(clicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 event", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log) if log.get("name") is "ttrigger"

        @cy.get("button:first").ttrigger("mouseover").then ->
          expect(logs).to.have.length(1)

      it "passes in coords", ->
        @cy.get("button:first").ttrigger("mouseover").then ($btn) ->
          coords = @cy.getCoordinates($btn)
          expect(@log.get("coords")).to.deep.eq coords

      it "ends", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log) if log.get("name") is "click"

        @cy.get("button").invoke("slice", 0, 2).click({multiple: true}).then ->
          _.each logs, (log) ->
            expect(log.get("state")).to.eq("passed")
            expect(log.get("ended")).to.be.true

      it "#consoleProps", ->
        @cy.get("button:first").ttrigger("mouseover").then ($button) ->
          consoleProps = @log.attributes.consoleProps()
          coords       = @cy.getCoordinates($button)
          logCoords    = @log.get("coords")
          eventOptions = consoleProps["Event options"]
          expect(logCoords.x).to.be.closeTo(coords.x, 1) ## ensure we are within 1
          expect(logCoords.y).to.be.closeTo(coords.y, 1) ## ensure we are within 1
          expect(consoleProps.Command).to.eq "ttrigger"
          expect(eventOptions.bubbles).to.be.true
          expect(eventOptions.cancelable).to.be.true
          expect(eventOptions.clientX).to.be.be.a("number")
          expect(eventOptions.clientY).to.be.be.a("number")
          expect(eventOptions.pageX).to.be.be.a("number")
          expect(eventOptions.pageY).to.be.be.a("number")

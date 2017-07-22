$ = Cypress.$.bind(Cypress)
_ = Cypress._

describe "src/cy/commands/actions/misc", ->
  before ->
    cy
      .visit("/support/server/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#hover", ->
    it "throws when invoking", (done) ->
      cy.on "fail", (err) ->
        expect(err.message).to.include "cy.hover() is not currently implemented."
        expect(err.message).to.include "https://on.cypress.io/hover"
        done()

      cy.get("button").hover()

  context "#trigger", ->
    it "sends event", (done) ->
      $btn = cy.$$("#button")

      coords = cy.getAbsoluteCoordinates($btn)

      $btn.on "mouseover", (e) =>
        obj = _.pick(e.originalEvent, "bubbles", "cancelable", "clientX", "clientY", "target", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          clientX: coords.x - cy.state("window").pageXOffset
          clientY: coords.y - cy.state("window").pageYOffset
          target: $btn.get(0)
          type: "mouseover"
        }
        done()

      cy.get("#button").trigger("mouseover")

    it "bubbles up event by default", (done) ->
      cy
        .window()
        .then (win) ->
          $(win).one "mouseover", ->
            done()

          cy.get("#button").trigger("mouseover")

    it "does not bubble up event if specified", (done) ->
      cy
        .window()
        .then (win) ->
          $win = $(win)

          $win.on "mouseover", ->
            done(new Error("should not have bubbled up to window listener"))

          cy.get("#button").trigger("mouseover", {bubbles: false}).then ->
            $win.off "mouseover"

            done()

    it "sends through event options, overriding defaults", (done) ->
      options = {
        clientX: 42
        clientY: 24
        pageX: 420
        pageY: 240
        foo: "foo"
      }

      cy.$$("button:first").on "mouseover", (e) =>
        eventOptions = _.pick(e.originalEvent, "clientX", "clientY", "pageX", "pageY", "foo")
        ## options gets mutated by the command :(
        options = _.pick(options, "clientX", "clientY", "pageX", "pageY", "foo")
        expect(eventOptions).to.eql(options)
        done()

      cy.get("button:first").trigger("mouseover", options)

    it "records correct clientX when el scrolled", (done) ->
      $btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo cy.$$("body")

      coords = cy.getAbsoluteCoordinates($btn)

      win = cy.state("window")

      $btn.on "mouseover", (e) =>
        expect(win.pageXOffset).to.be.gt(0)
        expect(e.clientX).to.eq coords.x - win.pageXOffset
        done()

      cy.get("#scrolledBtn").trigger("mouseover")

    it "records correct clientY when el scrolled", (done) ->
      $btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo cy.$$("body")

      coords = cy.getAbsoluteCoordinates($btn)

      win = cy.state("window")

      $btn.on "mouseover", (e) =>
        expect(win.pageYOffset).to.be.gt(0)
        expect(e.clientY).to.eq coords.y - win.pageYOffset
        done()

      cy.get("#scrolledBtn").trigger("mouseover")

    it "waits until element becomes visible", ->
      $btn = cy.$$("#button").hide()

      retried = false

      cy.on "command:retry", _.after 3, ->
        $btn.show()
        retried = true

      cy.get("#button").trigger("mouseover").then ->
        expect(retried).to.be.true

    it "waits until element is no longer disabled", ->
      $btn = cy.$$("#button").prop("disabled", true)

      retried = false
      mouseovers = 0

      $btn.on "mouseover", ->
        mouseovers += 1

      cy.on "command:retry", _.after 3, ->
        $btn.prop("disabled", false)
        retried = true

      cy.get("#button").trigger("mouseover").then ->
        expect(mouseovers).to.eq(1)
        expect(retried).to.be.true

    it.skip "waits until element stops animating", (done) ->
      retries = []
      mouseovers  = 0

      p = $("<p class='slidein'>sliding in</p>")
      p.on "mouseover", -> mouseovers += 1
      p.css("animation-duration", ".5s")

      cy.on "command:retry", (obj) ->
        expect(mouseovers).to.eq(0)
        retries.push(obj)

      p.on "animationstart", =>
        t = Date.now()
        _.delay =>
          cy.get(".slidein").trigger("mouseover").then ->
            expect(retries.length).to.be.gt(5)
            done()
        , 100

      cy.$$("#animation-container").append(p)

    it "does not throw when waiting for animations is disabled", ->
      cy.stub(Cypress, "config").withArgs("waitForAnimations").returns(false)

      cy.timeout(100)

      p = $("<p class='slidein'>sliding in</p>")
      p.css("animation-duration", ".5s")

      cy.$$("#animation-container").append(p)

      cy.get(".slidein").trigger("mouseover")

    it "does not throw when turning off waitForAnimations in options", ->
      cy.timeout(100)

      p = $("<p class='slidein'>sliding in</p>")
      p.css("animation-duration", ".5s")

      cy.$$("#animation-container").append(p)

      cy.get(".slidein").trigger("mouseover", {waitForAnimations: false})

    it "does not throw when setting animationDistanceThreshold extremely high in options", ->
      cy.timeout(100)

      p = $("<p class='slidein'>sliding in</p>")
      p.css("animation-duration", ".5s")

      cy.$$("#animation-container").append(p)

      cy.get(".slidein").trigger("mouseover", {animationDistanceThreshold: 1000})

    describe "assertion verification", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.$$("button:first").on "mouseover", ->
          _.delay =>
            $(@).addClass("moused-over")
          , 50
          return false

        cy.get("button:first").trigger("mouseover").should("have.class", "moused-over").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe "position argument", ->
      it "can trigger event on center by default", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(108)
          expect(e.clientY).to.equal(50)
          done()

        $button.one("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover")

      it "can trigger event on center", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(108)
          expect(e.clientY).to.equal(50)
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", "center")

      it "can trigger event on topLeft", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))
        onMouseover = (e) ->
          expect(e.clientX).to.equal(8)
          expect(e.clientY).to.equal(0)
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", "topLeft")

      it "can trigger event on topRight", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(0)
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", "topRight")

      it "can trigger event on bottomLeft", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(8)
          expect(e.clientY).to.equal(99)
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", "bottomLeft")

      it "can trigger event on bottomRight", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(99)
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", "bottomRight")

      it "can pass options along with position", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(99)
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", "bottomRight", {bubbles: false})

    describe "relative coordinate arguments", ->
      it "can specify x and y", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(83)
          expect(e.clientY).to.equal(78)
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", 75, 78)

      it "can pass options along with x, y", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(83)
          expect(e.clientY).to.equal(78)
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", 75, 78, {bubbles: false})

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws when eventName is not a string", ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.trigger() can only be called on a single element. Your subject contained 14 elements."
          done()

        cy.get("button:first").trigger("cy.trigger() must be passed a non-empty string as its 1st argument. You passed: 'undefined'.")

      it "throws when not a dom subject", (done) ->
        cy.on "fail", -> done()

        cy.trigger("mouseover")

      it "throws when attempting to trigger multiple elements", (done) ->
        num = cy.$$("button").length

        cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.trigger() can only be called on a single element. Your subject contained #{num} elements."
          done()

        cy.get("button").trigger("mouseover")

      it "throws when subject is not in the document", (done) ->
        clicked = 0

        checkbox = cy.$$(":checkbox:first").on "mouseover", (e) ->
          clicked += 1
          checkbox.remove()
          return false

        cy.on "fail", (err) ->
          expect(clicked).to.eq 1
          expect(err.message).to.include "cy.trigger() failed because this element"
          done()

        cy.get(":checkbox:first").trigger("mouseover").trigger("mouseover")

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs).to.have.length(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.trigger("mouseover")

      it "throws when the subject isnt visible", (done) ->
        $btn = cy.$$("#button:first").hide()

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(2)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "cy.trigger() failed because this element is not visible"
          done()

        cy.get("button:first").trigger("mouseover")

      it "throws when subject is disabled", (done) ->
        $btn = cy.$$("#button").prop("disabled", true)

        cy.on "fail", (err) =>
          ## get + click logs
          expect(@logs.length).eq(2)
          expect(err.message).to.include("cy.trigger() failed because this element is disabled:\n")
          done()

        cy.get("#button").trigger("mouseover")

      it "throws when provided invalid position", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(2)
          expect(err.message).to.eq "Invalid position argument: 'foo'. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight."
          done()

        cy.get("button:first").trigger("mouseover", "foo")

      ## FIXME: change to unit test that doesn't rely on real animation
      ## write one test that integration tests animations
      it.skip "throws when element animation exceeds timeout", (done) ->
        cy.timeout(100)

        mouseovers = 0

        p = $("<p class='slidein'>sliding in</p>")
        p.css("animation-duration", ".5s")
        p.on "mouseover", -> mouseovers += 1

        cy.on "fail", (err) ->
          expect(mouseovers).to.eq(0)
          expect(err.message).to.include("cy.trigger() could not be issued because this element is currently animating:\n")
          done()

        p.on "animationstart", =>
          cy.get(".slidein").trigger("mouseover", {interval: 50, animationDistanceThreshold: 0})

        cy.$$("#animation-container").append(p)

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get("button:first").trigger("mouseover").should("have.class", "moused-over")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(3)
          done()

        cy.get("button:first").trigger("mouseover").should("have.class", "moused-over")

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          @lastLog = log

        return null

      it "logs immediately before resolving", (done) ->
        button = cy.$$("button:first")

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "trigger"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        cy.get("button:first").trigger("mouseover")

      it "snapshots before triggering", (done) ->
        cy.$$("button:first").on "mouseover", =>
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[0].body).to.be.an("object")
          done()

        cy.get("button:first").trigger("mouseover")

      it "snapshots after triggering", ->
        cy.get("button:first").trigger("mouseover").then ($button) ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(lastLog.get("snapshots")[1].body).to.be.an("object")

      it "returns only the $el for the element of the subject that was triggered", ->
        clicks = []

        ## append two buttons
        button = -> $("<button class='clicks'>click</button>")
        cy.$$("body").append(button()).append(button())

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "click"
            clicks.push(log)

        cy.get("button.clicks").click({multiple: true}).then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(clicks.length).to.eq(2)
          expect(clicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 event", ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "trigger"
            logs.push(log)

        cy.get("button:first").trigger("mouseover").then ->
          expect(logs).to.have.length(1)

      it "passes in coords", ->
        cy.get("button:first").trigger("mouseover").then ($btn) ->
          lastLog = @lastLog

          coords = cy.getAbsoluteCoordinates($btn)
          expect(lastLog.get("coords")).to.deep.eq coords

      it "ends", ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "click"
            logs.push(log)

        cy.get("button").invoke("slice", 0, 2).click({multiple: true}).then ->
          _.each logs, (log) ->
            expect(log.get("state")).to.eq("passed")
            expect(log.get("ended")).to.be.true

      it "#consoleProps", ->
        cy.get("button:first").trigger("mouseover").then ($button) =>
          consoleProps = @lastLog.invoke("consoleProps")
          coords       = cy.getAbsoluteCoordinates($button)
          logCoords    = @lastLog.get("coords")
          eventOptions = consoleProps["Event options"]
          expect(logCoords.x).to.be.closeTo(coords.x, 1) ## ensure we are within 1
          expect(logCoords.y).to.be.closeTo(coords.y, 1) ## ensure we are within 1
          expect(consoleProps.Command).to.eq "trigger"
          expect(eventOptions.bubbles).to.be.true
          expect(eventOptions.cancelable).to.be.true
          expect(eventOptions.clientX).to.be.be.a("number")
          expect(eventOptions.clientY).to.be.be.a("number")
          expect(eventOptions.pageX).to.be.be.a("number")
          expect(eventOptions.pageY).to.be.be.a("number")

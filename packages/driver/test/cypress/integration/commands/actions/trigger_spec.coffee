$ = Cypress.$.bind(Cypress)
_ = Cypress._

describe "src/cy/commands/actions/trigger", ->
  before ->
    cy
      .visit("/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#trigger", ->
    it "sends event", (done) ->
      $btn = cy.$$("#button")

      $btn.on "mouseover", (e) =>
        { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        obj = _.pick(e.originalEvent, "bubbles", "cancelable", "target", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          target: $btn.get(0)
          type: "mouseover"
        }

        expect(e.clientX).to.be.closeTo(fromElViewport.x, 1)
        expect(e.clientY).to.be.closeTo(fromElViewport.y, 1)
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

          $win.on "keydown", (e) ->
            evt = JSON.stringify(e.originalEvent, [
              "bubbles", "cancelable", "isTrusted", "type", "clientX", "clientY"
            ])

            done(new Error("event should not have bubbled up to window listener: #{evt}"))

          cy
          .get("#button")
          .trigger("keydown", {
            bubbles: false
          })
          .then ->
            $win.off "keydown"

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

      win = cy.state("window")

      $btn.on "mouseover", (e) =>
        { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.scrollX).to.be.gt(0)
        expect(e.clientX).to.be.closeTo(fromElViewport.x, 1)
        done()

      cy.get("#scrolledBtn").trigger("mouseover")

    it "records correct clientY when el scrolled", (done) ->
      $btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo cy.$$("body")

      win = cy.state("window")

      $btn.on "mouseover", (e) =>
        { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.scrollX).to.be.gt(0)
        expect(e.clientY).to.be.closeTo(fromElViewport.y, 1)
        done()

      cy.get("#scrolledBtn").trigger("mouseover")

    ## NOTE: flaky about 50% of the time in Firefox...
    ## temporarily skipping for now, but this needs
    ## to be reenabled after launch once we have time
    ## to look at the underlying failure cause
    it.skip "records correct pageX and pageY el scrolled", (done) ->
      $btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo cy.$$("body")

      win = cy.state("window")

      $btn.on "mouseover", (e) =>
        { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(e.pageX).to.be.closeTo(win.scrollX + e.clientX, 1)
        expect(e.pageY).to.be.closeTo(win.scrollY + e.clientY, 1)
        done()

      cy.get("#scrolledBtn").trigger("mouseover")

    it "does not change the subject", ->
      $input = cy.$$("input:first")

      cy.get("input:first").trigger("keydown").then ($el) ->
        expect($el.get(0)).to.eq($input.get(0))

    it "can trigger events on the window", ->
      expected = false

      win = cy.state("window")

      $(win).on "scroll", (e) ->
        expected = true

      cy
        .window().trigger("scroll")
        .then ->
          expect(expected).to.be.true

    it "can trigger custom events on the window", ->
      expected = false

      win = cy.state("window")

      $(win).on "foo", (e) ->
        expect(e.detail).to.deep.eq({foo: "bar"})
        expected = true

      cy
        .window().trigger("foo", {
          detail: { foo: "bar" }
        })
        .then ->
          expect(expected).to.be.true

    it "can trigger events on the document", ->
      expected = false

      doc = cy.state("document")

      $(doc).on "dragover", ->
        expected = true

      cy.document().trigger("dragover").then ->
        expect(expected).to.be.true

    it "can handle window w/length > 1 as a subject", ->
      cy.window().should('have.length.gt', 1)
      .trigger('click')

    describe "actionability", ->
      it "can trigger on elements which are hidden until scrolled within parent container", ->
        cy.get("#overflow-auto-container").contains("quux").trigger("mousedown")

      it "can trigger on readonly inputs", ->
        cy.get("#readonly-attr").trigger("mousedown")

      it "does not scroll when being forced", ->
        scrolled = []

        cy.on "scrolled", ($el, type) ->
          scrolled.push(type)

        cy
          .get("button:last").trigger("mouseover", { force: true })
          .then ->
            expect(scrolled).to.be.empty

      it "can force trigger on hidden elements", ->
        cy.get("button:first").invoke("hide").trigger("tap", { force: true })

      it "can force trigger on disabled elements", ->
        cy.get("input:first").invoke("prop", "disabled", true).trigger("tap", { force: true })

      it "can forcibly trigger even when being covered by another element", ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").prependTo(cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(cy.$$("body"))

        scrolled = []
        retried = false
        tapped = false

        cy.on "scrolled", ($el, type) ->
          scrolled.push(type)

        cy.on "command:retry", ($el, type) ->
          retried = true

        $btn.on "tap", ->
          tapped = true

        cy.get("#button-covered-in-span").trigger("tap", {force: true}).then ->
          expect(scrolled).to.be.empty
          expect(retried).to.be.false
          expect(tapped).to.be.true

      it "eventually triggers when covered up", ->
        $btn = $("<button>button covered</button>")
        .attr("id", "button-covered-in-span")
        .prependTo(cy.$$("body"))

        $span = $("<span>span on button</span>").css({
          position: "absolute",
          left: $btn.offset().left,
          top: $btn.offset().top,
          padding: 5,
          display: "inline-block",
          backgroundColor: "yellow"
        }).prependTo(cy.$$("body"))

        scrolled = []
        retried = false

        cy.on "scrolled", ($el, type) ->
          scrolled.push(type)

        cy.on "command:retry", _.after 3, ->
          $span.hide()
          retried = true

        cy.get("#button-covered-in-span").trigger("mousedown").then ->
          expect(retried).to.be.true

          ## - element scrollIntoView
          ## - element scrollIntoView (retry animation coords)
          ## - element scrollIntoView (retry covered)
          ## - element scrollIntoView (retry covered)
          ## - window
          expect(scrolled).to.deep.eq(["element", "element", "element", "element"])

      it "issues event to descendent", ->
        mouseovers = 0

        $btn = $("<div>", {
          id: "div-covered-in-span"
        })
        .css({ padding: 10, margin: 0, border: "solid 1px #000" })
        .prependTo(cy.$$("body"))

        $span = $("<span>span covering div</span>")
        .css({ padding: 5, display: 'block', backgroundColor: "yellow" })
        .appendTo($btn)

        $btn.on "mouseover", -> mouseovers += 1
        $span.on "mouseover", -> mouseovers += 1

        cy
          .get("#div-covered-in-span").trigger("mouseover")
          .should ->
            expect(mouseovers).to.eq(2)

      it "scrolls the window past a fixed position element when being covered", ->
        $btn = $("<button>button covered</button>")
        .attr("id", "button-covered-in-nav")
        .appendTo(cy.$$("#fixed-nav-test"))

        $nav = $("<nav>nav on button</nav>").css({
          position: "fixed",
          left: 0
          top: 0,
          padding: 20,
          backgroundColor: "yellow"
          zIndex: 1
        }).prependTo(cy.$$("body"))

        scrolled = []

        cy.on "scrolled", ($el, type) ->
          scrolled.push(type)

        cy.get("#button-covered-in-nav").trigger("mouseover").then ->
          ## - element scrollIntoView
          ## - element scrollIntoView (retry animation coords)
          ## - window
          expect(scrolled).to.deep.eq(["element", "element", "window"])

      it "scrolls the window past two fixed positioned elements when being covered", ->
        $btn = $("<button>button covered</button>")
        .attr("id", "button-covered-in-nav")
        .appendTo(cy.$$("#fixed-nav-test"))

        $nav = $("<nav>nav on button</nav>").css({
          position: "fixed",
          left: 0
          top: 0,
          padding: 20,
          backgroundColor: "yellow"
          zIndex: 1
        }).prependTo(cy.$$("body"))

        $nav2 = $("<nav>nav2 on button</nav>").css({
          position: "fixed",
          left: 0
          top: 40,
          padding: 20,
          backgroundColor: "red"
          zIndex: 1
        }).prependTo(cy.$$("body"))

        scrolled = []

        cy.on "scrolled", ($el, type) ->
          scrolled.push(type)

        cy.get("#button-covered-in-nav").trigger("mouseover").then ->
          ## - element scrollIntoView
          ## - element scrollIntoView (retry animation coords)
          ## - window (nav1)
          ## - window (nav2)
          expect(scrolled).to.deep.eq(["element", "element", "window", "window"])

      it "scrolls a container past a fixed position element when being covered", ->
        cy.viewport(600, 450)

        $body = cy.$$("body")

        ## we must remove all of our children to
        ## prevent the window from scrolling
        $body.children().remove()

        ## this tests that our container properly scrolls!
        $container = $("<div></div>")
        .attr("id", "scrollable-container")
        .css({
          position: "relative"
          width: 300
          height: 200
          marginBottom: 100
          backgroundColor: "green"
          overflow: "auto"
        })
        .prependTo($body)

        $btn = $("<button>button covered</button>")
        .attr("id", "button-covered-in-nav")
        .css({
          marginTop: 500
          # marginLeft: 500
          marginBottom: 500
        })
        .appendTo($container)

        $nav = $("<nav>nav on button</nav>")
        .css({
          position: "fixed",
          left: 0
          top: 0,
          padding: 20,
          backgroundColor: "yellow"
          zIndex: 1
        })
        .prependTo($container)

        scrolled = []

        cy.on "scrolled", ($el, type) ->
          scrolled.push(type)

        cy.get("#button-covered-in-nav").trigger("mouseover").then ->
          ## - element scrollIntoView
          ## - element scrollIntoView (retry animation coords)
          ## - window
          ## - container
          expect(scrolled).to.deep.eq(["element", "element", "window", "container"])

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

      it "waits until element stops animating", ->
        retries = 0

        cy.on "command:retry", (obj) ->
          retries += 1

        cy.stub(cy, "ensureElementIsNotAnimating")
        .throws(new Error("animating!"))
        .onThirdCall().returns()

        cy.get("button:first").trigger("mouseover").then ->
          ## - retry animation coords
          ## - retry animation
          ## - retry animation
          expect(retries).to.eq(3)
          expect(cy.ensureElementIsNotAnimating).to.be.calledThrice

      it "does not throw when waiting for animations is disabled", ->
        cy.stub(cy, "ensureElementIsNotAnimating").throws(new Error("animating!"))
        Cypress.config("waitForAnimations", false)

        cy.get("button:first").trigger("mouseover").then ->
          expect(cy.ensureElementIsNotAnimating).not.to.be.called

      it "does not throw when turning off waitForAnimations in options", ->
        cy.stub(cy, "ensureElementIsNotAnimating").throws(new Error("animating!"))

        cy.get("button:first").trigger("tap", {waitForAnimations: false}).then ->
          expect(cy.ensureElementIsNotAnimating).not.to.be.called

      it "passes options.animationDistanceThreshold to cy.ensureElementIsNotAnimating", ->
        $btn = cy.$$("button:first")

        { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

        cy.spy(cy, "ensureElementIsNotAnimating")

        cy.get("button:first").trigger("tap", {animationDistanceThreshold: 1000}).then ->
          args = cy.ensureElementIsNotAnimating.firstCall.args

          expect(args[1]).to.deep.eq([fromElWindow, fromElWindow])
          expect(args[2]).to.eq(1000)

      it "passes config.animationDistanceThreshold to cy.ensureElementIsNotAnimating", ->
        animationDistanceThreshold = Cypress.config("animationDistanceThreshold")

        $btn = cy.$$("button:first")

        { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

        cy.spy(cy, "ensureElementIsNotAnimating")

        cy.get("button:first").trigger("mouseover").then ->
          args = cy.ensureElementIsNotAnimating.firstCall.args

          expect(args[1]).to.deep.eq([fromElWindow, fromElWindow])
          expect(args[2]).to.eq(animationDistanceThreshold)

    describe "assertion verification", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        $btn = cy.$$("button:first")

        cy.on "command:retry", _.once ->
          $btn.addClass("moused-over")

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
          ## NOTE: firefox leaves 1px on top of element on scroll, so add top offset
          expect(e.clientY).to.equal(0 + Math.ceil(e.target.getBoundingClientRect().top))
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", "topLeft")

      it "can trigger event on topRight", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(0 + Math.ceil(e.target.getBoundingClientRect().top))
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
          expect(e.clientY).to.equal(78 + Math.ceil(e.target.getBoundingClientRect().top))
          done()

        $button.on("mouseover", onMouseover)

        cy.get("button:first").trigger("mouseover", 75, 78)

      it "can pass options along with x, y", (done) ->
        $button = cy.$$("<button />").css({width:200,height:100}).prependTo(cy.$$("body"))

        onMouseover = (e) ->
          expect(e.clientX).to.equal(83)
          expect(e.clientY).to.equal(78 + Math.ceil(e.target.getBoundingClientRect().top))
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
          expect(err.message).to.eq "`cy.trigger()` can only be called on a single element. Your subject contained 15 elements."
          expect(err.docsUrl).to.eq("https://on.cypress.io/trigger")
          done()

        cy.get("button:first").trigger("`cy.trigger()` must be passed a non-empty string as its 1st argument. You passed: 'undefined'.")

      it "throws when not a dom subject", (done) ->
        cy.on "fail", -> done()

        cy.trigger("mouseover")

      it "throws when attempting to trigger multiple elements", (done) ->
        num = cy.$$("button").length

        cy.on "fail", (err) ->
          expect(err.message).to.eq "`cy.trigger()` can only be called on a single element. Your subject contained #{num} elements."
          expect(err.docsUrl).to.eq("https://on.cypress.io/trigger")
          done()

        cy.get("button").trigger("mouseover")

      it "throws when subject is not in the document", (done) ->
        mouseover = 0

        checkbox = cy.$$(":checkbox:first").on "mouseover", (e) ->
          mouseover += 1
          checkbox.remove()
          return false

        cy.on "fail", (err) ->
          expect(mouseover).to.eq 1
          expect(err.message).to.include "`cy.trigger()` failed because this element"
          done()

        cy.get(":checkbox:first").trigger("mouseover").trigger("mouseover")

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(2)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.wrap({}).trigger("mouseover")

      it "throws when the subject isnt visible", (done) ->
        $btn = cy.$$("#button:first").hide()

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(2)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "`cy.trigger()` failed because this element is not visible"
          done()

        cy.get("button:first").trigger("mouseover")

      it "throws when subject is disabled", (done) ->
        $btn = cy.$$("#button").prop("disabled", true)

        cy.on "fail", (err) =>
          ## get + click logs
          expect(@logs.length).eq(2)
          expect(err.message).to.include("`cy.trigger()` failed because this element is `disabled`:\n")
          done()

        cy.get("#button").trigger("mouseover")

      it "throws when provided invalid position", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(2)
          expect(err.message).to.eq "Invalid position argument: `foo`. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight."
          done()

        cy.get("button:first").trigger("mouseover", "foo")

      it "throws when element animation exceeds timeout", (done) ->
        ## force the animation calculation to think we moving at a huge distance ;-)
        cy.stub(Cypress.utils, "getDistanceBetween").returns(100000)

        clicks = 0

        cy.$$("button:first").on "tap", ->
          clicks += 1

        cy.on "fail", (err) ->
          expect(clicks).to.eq(0)
          expect(err.message).to.include("`cy.trigger()` could not be issued because this element is currently animating:\n")
          expect(err.docsUrl).to.eq("https://on.cypress.io/element-is-animating")
          done()

        cy.get("button:first").trigger("tap")

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

      it "logs only 1 event", ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "trigger"
            logs.push(log)

        cy.get("button:first").trigger("mouseover").then ->
          expect(logs.length).to.eq(1)

      it "passes in coords", ->
        cy.get("button:first").trigger("mouseover").then ($btn) ->
          lastLog = @lastLog

          { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)
          expect(lastLog.get("coords")).to.deep.eq(fromElWindow, "x", "y")

      it "#consoleProps", ->
        cy.get("button:first").trigger("mouseover").then ($button) =>
          consoleProps = @lastLog.invoke("consoleProps")
          { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($button)
          logCoords    = @lastLog.get("coords")
          eventOptions = consoleProps["Event options"]
          expect(logCoords.x).to.be.closeTo(fromElWindow.x, 1) ## ensure we are within 1
          expect(logCoords.y).to.be.closeTo(fromElWindow.y, 1) ## ensure we are within 1
          expect(consoleProps.Command).to.eq "trigger"
          expect(eventOptions.bubbles).to.be.true
          expect(eventOptions.cancelable).to.be.true
          expect(eventOptions.clientX).to.be.be.a("number")
          expect(eventOptions.clientY).to.be.be.a("number")
          expect(eventOptions.pageX).to.be.be.a("number")
          expect(eventOptions.pageY).to.be.be.a("number")
          expect(eventOptions.screenX).to.be.be.a("number").and.eq(eventOptions.clientX)
          expect(eventOptions.screenY).to.be.be.a("number").and.eq(eventOptions.clientY)

$ = Cypress.$.bind(Cypress)
_ = Cypress._
Promise = Cypress.Promise

fail = (str) ->
  throw new Error(str)

describe "src/cy/commands/actions/click", ->
  before ->
    cy
      .visit("/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#click", ->
    it "receives native click event", (done) ->
      $btn = cy.$$("#button")

      $btn.on "click", (e) =>
        { fromViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        obj = _.pick(e.originalEvent, "bubbles", "cancelable", "view", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: cy.state("window")
          button: 0
          buttons: 0
          which: 1
          relatedTarget: null
          altKey: false
          ctrlKey: false
          shiftKey: false
          metaKey: false
          detail: 1
          type: "click"
        }

        expect(e.clientX).to.be.closeTo(fromViewport.x, 1)
        expect(e.clientY).to.be.closeTo(fromViewport.y, 1)
        done()

      cy.get("#button").click()

    it "bubbles up native click event", (done) ->
      click = (e) =>
        cy.state("window").removeEventListener "click", click
        done()

      cy.state("window").addEventListener "click", click

      cy.get("#button").click()

    it "sends native mousedown event", (done) ->
      $btn = cy.$$("#button")

      win = cy.state("window")

      $btn.get(0).addEventListener "mousedown", (e) ->
        ## calculate after scrolling
        { fromViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        obj = _.pick(e, "bubbles", "cancelable", "view", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: win
          button: 0
          buttons: 1
          which: 1
          relatedTarget: null
          altKey: false
          ctrlKey: false
          shiftKey: false
          metaKey: false
          detail: 1
          type: "mousedown"
        }

        expect(e.clientX).to.be.closeTo(fromViewport.x, 1)
        expect(e.clientY).to.be.closeTo(fromViewport.y, 1)
        done()

      cy.get("#button").click()

    it "sends native mouseup event", (done) ->
      $btn = cy.$$("#button")

      win = cy.state("window")

      $btn.get(0).addEventListener "mouseup", (e) ->
        { fromViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        obj = _.pick(e, "bubbles", "cancelable", "view", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: win
          button: 0
          buttons: 0
          which: 1
          relatedTarget: null
          altKey: false
          ctrlKey: false
          shiftKey: false
          metaKey: false
          detail: 1
          type: "mouseup"
        }

        expect(e.clientX).to.be.closeTo(fromViewport.x, 1)
        expect(e.clientY).to.be.closeTo(fromViewport.y, 1)
        done()

      cy.get("#button").click()

    it "sends mousedown, mouseup, click events in order", ->
      events = []

      $btn = cy.$$("#button")

      _.each "mousedown mouseup click".split(" "), (event) ->
        $btn.get(0).addEventListener event, ->
          events.push(event)

      cy.get("#button").click().then ->
        expect(events).to.deep.eq ["mousedown", "mouseup", "click"]

    it "records correct clientX when el scrolled", (done) ->
      $btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo cy.$$("body")

      win = cy.state("window")

      $btn.get(0).addEventListener "click", (e) =>
        { fromViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.pageXOffset).to.be.gt(0)
        expect(e.clientX).to.be.closeTo(fromViewport.x, 1)
        done()

      cy.get("#scrolledBtn").click()

    it "records correct clientY when el scrolled", (done) ->
      $btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo cy.$$("body")

      win = cy.state("window")

      $btn.get(0).addEventListener "click", (e) =>
        { fromViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.pageYOffset).to.be.gt(0)
        expect(e.clientY).to.be.closeTo(fromViewport.y, 1)
        done()

      cy.get("#scrolledBtn").click()

    it "will send all events even mousedown is defaultPrevented", ->
      events = []

      $btn = cy.$$("#button")

      $btn.get(0).addEventListener "mousedown", (e) ->
        e.preventDefault()
        expect(e.defaultPrevented).to.be.true

      _.each "mouseup click".split(" "), (event) ->
        $btn.get(0).addEventListener event, ->
          events.push(event)

      cy.get("#button").click().then ->
        expect(events).to.deep.eq ["mouseup", "click"]

    it "sends a click event", (done) ->
      cy.$$("#button").click -> done()

      cy.get("#button").click()

    it "returns the original subject", ->
      button = cy.$$("#button")

      cy.get("#button").click().then ($button) ->
        expect($button).to.match button

    it "causes focusable elements to receive focus", (done) ->
      $text = cy.$$(":text:first")

      $text.focus -> done()

      cy.get(":text:first").click()

    it "does not fire a focus, mouseup, or click event when element has been removed on mousedown", ->
      $btn = cy.$$("button:first")

      $btn.on "mousedown", ->
        ## synchronously remove this button
        $(@).remove()

      $btn.on "focus", -> fail("should not have gotten focus")
      $btn.on "focusin", -> fail("should not have gotten focusin")
      $btn.on "mouseup", -> fail("should not have gotten mouseup")
      $btn.on "click", -> fail("should not have gotten click")

      cy.contains("button").click()

    it "does not fire a click when element has been removed on mouseup", ->
      $btn = cy.$$("button:first")

      $btn.on "mouseup", ->
        ## synchronously remove this button
        $(@).remove()

      $btn.on "click", -> fail("should not have gotten click")

      cy.contains("button").click()

    it "silences errors on unfocusable elements", ->
      div = cy.$$("div:first")

      cy.get("div:first").click({force: true})

    it "causes first focused element to receive blur", ->
      blurred = false

      cy.$$("input:first").blur ->
        blurred = true

      cy
        .get("input:first").focus()
        .get("input:text:last").click()
        .then ->
          expect(blurred).to.be.true

    it "inserts artificial delay of 50ms", ->
      cy.spy(Promise, "delay")

      cy.get("#button").click().then ->
        expect(Promise.delay).to.be.calledWith 50

    it "delays 50ms before resolving", ->
      cy.$$("button:first").on "click", (e) =>
        cy.spy(Promise, "delay")

      cy.get("button:first").click({ multiple: true}).then  ->
        expect(Promise.delay).to.be.calledWith(50, "click")

    it "can operate on a jquery collection", ->
      clicks = 0
      buttons = cy.$$("button").slice(0, 3)
      buttons.click ->
        clicks += 1
        return false

      ## make sure we have more than 1 button
      expect(buttons.length).to.be.gt 1

      ## make sure each button received its click event
      cy.get("button").invoke("slice", 0, 3).click({ multiple: true}).then ($buttons) ->
        expect($buttons.length).to.eq clicks

    it "can cancel multiple clicks", (done) ->
      cy.stub(Cypress.runner, "stop")

      ## abort after the 3rd click
      stop = _.after 3, ->
        Cypress.stop()

      clicked = cy.spy ->
        stop()

      $anchors = cy.$$("#sequential-clicks a")

      $anchors.on("click", clicked)

      ## make sure we have at least 5 anchor links
      expect($anchors.length).to.be.gte 5

      cy.on "stop", =>
        ## timeout will get called synchronously
        ## again during a click if the click function
        ## is called
        timeout = cy.spy(cy.timeout)

        _.delay ->
          ## and we should have stopped clicking after 3
          expect(clicked.callCount).to.eq 3

          expect(timeout.callCount).to.eq 0

          done()
        , 100

      cy.get("#sequential-clicks a").click({ multiple: true })

    it "serially clicks a collection", ->
      clicks = 0

      ## create a throttled click function
      ## which proves we are clicking serially
      throttled = _.throttle ->
        clicks += 1
      , 5, {leading: false}

      anchors = cy.$$("#sequential-clicks a")
      anchors.click throttled

      ## make sure we're clicking multiple anchors
      expect(anchors.length).to.be.gt 1
      cy.get("#sequential-clicks a").click({ multiple: true}).then ($anchors) ->
        expect($anchors.length).to.eq clicks

    it "increases the timeout delta after each click", ->
      count = cy.$$("#three-buttons button").length

      cy.spy(cy, "timeout")

      cy.get("#three-buttons button").click({ multiple: true}).then  ->
        calls = cy.timeout.getCalls()

        num = _.filter calls, (call) ->
          _.isEqual(call.args, [50, true, "click"])

        expect(num.length).to.eq(count)

    ## this test needs to increase the height + width of the div
    ## when we implement scrollBy the delta of the left/top
    it "can click elements which are huge and the center is naturally below the fold", ->
      cy.get("#massively-long-div").click()

    it "can click a tr", ->
      cy.get("#table tr:first").click()

    describe "actionability", ->
      it "can click elements which are hidden until scrolled within parent container", ->
        cy.get("#overflow-auto-container").contains("quux").click()

      it "does not scroll when being forced", ->
        scrolled = []

        cy.on "scrolled", ($el, type) ->
          scrolled.push(type)

        cy
          .get("button:last").click({ force: true })
          .then ->
            expect(scrolled).to.be.empty

      it "can force click on hidden elements", ->
        cy.get("button:first").invoke("hide").click({ force: true })

      it "can force click on disabled elements", ->
        cy.get("input:first").invoke("prop", "disabled", true).click({ force: true })

      it "can forcibly click even when being covered by another element", ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").prependTo(cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(cy.$$("body"))

        scrolled = []
        retried = false
        clicked = false

        cy.on "scrolled", ($el, type) ->
          scrolled.push(type)

        cy.on "command:retry", ($el, type) ->
          retried = true

        $btn.on "click", ->
          clicked = true

        cy.get("#button-covered-in-span").click({force: true}).then ->
          expect(scrolled).to.be.empty
          expect(retried).to.be.false
          expect(clicked).to.be.true

      it "eventually clicks when covered up", ->
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

        cy.get("#button-covered-in-span").click().then ->
          expect(retried).to.be.true

          ## - element scrollIntoView
          ## - element scrollIntoView (retry animation coords)
          ## - element scrollIntoView (retry covered)
          ## - element scrollIntoView (retry covered)
          ## - window
          expect(scrolled).to.deep.eq(["element", "element", "element", "element"])

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

        cy.get("#button-covered-in-nav").click().then ->
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

        cy.get("#button-covered-in-nav").click().then ->
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

        cy.get("#button-covered-in-nav").click().then ->
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

        cy.get("#button").click().then ->
          expect(retried).to.be.true

      it "waits until element is no longer disabled", ->
        $btn = cy.$$("#button").prop("disabled", true)

        retried = false
        clicks = 0

        $btn.on "click", ->
          clicks += 1

        cy.on "command:retry", _.after 3, ->
          $btn.prop("disabled", false)
          retried = true

        cy.get("#button").click().then ->
          expect(clicks).to.eq(1)
          expect(retried).to.be.true

      it "waits until element stops animating", ->
        retries = 0

        cy.on "command:retry", (obj) ->
          retries += 1

        cy.stub(cy, "ensureElementIsNotAnimating")
        .throws(new Error("animating!"))
        .onThirdCall().returns()

        cy.get("button:first").click().then ->
          ## - retry animation coords
          ## - retry animation
          ## - retry animation
          expect(retries).to.eq(3)
          expect(cy.ensureElementIsNotAnimating).to.be.calledThrice

      it "does not throw when waiting for animations is disabled", ->
        cy.stub(cy, "ensureElementIsNotAnimating").throws(new Error("animating!"))
        Cypress.config("waitForAnimations", false)

        cy.get("button:first").click().then ->
          expect(cy.ensureElementIsNotAnimating).not.to.be.called

      it "does not throw when turning off waitForAnimations in options", ->
        cy.stub(cy, "ensureElementIsNotAnimating").throws(new Error("animating!"))

        cy.get("button:first").click({waitForAnimations: false}).then ->
          expect(cy.ensureElementIsNotAnimating).not.to.be.called

      it "passes options.animationDistanceThreshold to cy.ensureElementIsNotAnimating", ->
        $btn = cy.$$("button:first")

        { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

        cy.spy(cy, "ensureElementIsNotAnimating")

        cy.get("button:first").click({animationDistanceThreshold: 1000}).then ->
          args = cy.ensureElementIsNotAnimating.firstCall.args

          expect(args[1]).to.deep.eq([fromWindow, fromWindow])
          expect(args[2]).to.eq(1000)

      it "passes config.animationDistanceThreshold to cy.ensureElementIsNotAnimating", ->
        animationDistanceThreshold = Cypress.config("animationDistanceThreshold")

        $btn = cy.$$("button:first")

        { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

        cy.spy(cy, "ensureElementIsNotAnimating")

        cy.get("button:first").click().then ->
          args = cy.ensureElementIsNotAnimating.firstCall.args

          expect(args[1]).to.deep.eq([fromWindow, fromWindow])
          expect(args[2]).to.eq(animationDistanceThreshold)

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.$$("button:first").click ->
          _.delay =>
            $(@).addClass("clicked")
          , 50
          return false

        cy.get("button:first").click().should("have.class", "clicked").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

      it "eventually passes the assertion on multiple buttons", ->
        cy.$$("button").click ->
          _.delay =>
            $(@).addClass("clicked")
          , 50
          return false

        cy
          .get("button")
          .invoke("slice", 0, 2)
          .click({ multiple: true })
          .should("have.class", "clicked")

    describe "position argument", ->
      it "can click center by default", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left + 30, top: $btn.offset().top + 40, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click()

      it "can click topLeft", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))

        $span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        $span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click("topLeft")

      it "can click top", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left + 30, top: $btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click("top")

      it "can click topRight", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left + 80, top: $btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click("topRight")

      it "can click left", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left, top: $btn.offset().top + 40, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click("left")

      it "can click center", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left + 30, top: $btn.offset().top + 40, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click("center")

      it "can click right", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left + 80, top: $btn.offset().top + 40, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click("right")

      it "can click bottomLeft", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left, top: $btn.offset().top + 80, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click("bottomLeft")

      it "can click bottom", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left + 30, top: $btn.offset().top + 80, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click("bottom")

      it "can click bottomRight", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left + 80, top: $btn.offset().top + 80, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click("bottomRight")

      it "can pass options along with position", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left + 80, top: $btn.offset().top + 80, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(cy.$$("body"))

        $btn.on "click", -> done()

        cy.get("#button-covered-in-span").click("bottomRight", {force: true})

    describe "relative coordinate arguments", ->
      it "can specify x and y", (done) ->
        $btn = $("<button>button covered</button>")
        .attr("id", "button-covered-in-span")
        .css({height: 100, width: 100})
        .prependTo(cy.$$("body"))

        $span = $("<span>span</span>")
        .css({position: "absolute", left: $btn.offset().left + 50, top: $btn.offset().top + 65, padding: 5, display: "inline-block", backgroundColor: "yellow"})
        .appendTo($btn)

        clicked = _.after 2, -> done()

        $span.on "click", clicked
        $btn.on "click", clicked

        cy.get("#button-covered-in-span").click(75, 78)

      it "can pass options along with x, y", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: $btn.offset().left + 50, top: $btn.offset().top + 65, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(cy.$$("body"))

        $btn.on "click", -> done()

        cy.get("#button-covered-in-span").click(75, 78, {force: true})

    describe "mousedown", ->
      it "gives focus after mousedown", (done) ->
        input = cy.$$("input:first")

        input.get(0).addEventListener "focus", (e) =>
          obj = _.pick(e, "bubbles", "cancelable", "view", "which", "relatedTarget", "detail", "type")
          expect(obj).to.deep.eq {
            bubbles: false
            cancelable: false
            view: cy.state("window")
            ## chrome no longer fires pageX and pageY
            # pageX: 0
            # pageY: 0
            which: 0
            relatedTarget: null
            detail: 0
            type: "focus"
          }
          done()

        cy.get("input:first").click()

      it "gives focusin after mousedown", (done) ->
        input = cy.$$("input:first")

        input.get(0).addEventListener "focusin", (e) =>
          obj = _.pick(e, "bubbles", "cancelable", "view", "which", "relatedTarget", "detail", "type")
          expect(obj).to.deep.eq {
            bubbles: true
            cancelable: false
            view: cy.state("window")
            # pageX: 0
            # pageY: 0
            which: 0
            relatedTarget: null
            detail: 0
            type: "focusin"
          }
          done()

        cy.get("input:first").click()

      it "gives all events in order", ->
        events = []

        input = cy.$$("input:first")

        _.each "focus focusin mousedown mouseup click".split(" "), (event) ->
          input.get(0).addEventListener event, ->
            events.push(event)

        cy.get("input:first").click().then ->
          expect(events).to.deep.eq ["mousedown", "focus", "focusin", "mouseup", "click"]

      it "does not give focus if mousedown is defaultPrevented", (done) ->
        input = cy.$$("input:first")

        input.get(0).addEventListener "focus", (e) ->
          done("should not have recieved focused event")

        input.get(0).addEventListener "mousedown", (e) ->
          e.preventDefault()
          expect(e.defaultPrevented).to.be.true

        cy.get("input:first").click().then -> done()

      it "still gives focus to the focusable element even when click is issued to child element", ->
        $btn = $("<button>", id: "button-covered-in-span").prependTo(cy.$$("body"))
        span = $("<span>span in button</span>").css(padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo($btn)

        cy
          .get("#button-covered-in-span").click()
          .focused().should("have.id", "button-covered-in-span")

      it "will give focus to the window if no element is focusable", (done) ->
        $(cy.state("window")).on "focus", -> done()

        cy.get("#nested-find").click()

      # it "events", ->
      #   $btn = cy.$$("button")
      #   win = $(cy.state("window"))

      #   _.each {"btn": btn, "win": win}, (type, key) ->
      #     _.each "focus mousedown mouseup click".split(" "), (event) ->
      #     # _.each "focus focusin focusout mousedown mouseup click".split(" "), (event) ->
      #       type.get(0).addEventListener event, (e) ->
      #         if key is "btn"
      #           # e.preventDefault()
      #           e.stopPropagation()

      #         console.log "#{key} #{event}", e

        # $btn.on "mousedown", (e) ->
          # console.log("btn mousedown")
          # e.preventDefault()

        # win.on "mousedown", -> console.log("win mousedown")

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws when not a dom subject", (done) ->
        cy.on "fail", -> done()

        cy.click()

      it "throws when attempting to click multiple elements", (done) ->
        num = cy.$$("button").length

        cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.click() can only be called on a single element. Your subject contained 14 elements. Pass { multiple: true } if you want to serially click each element."
          done()

        cy.get("button").click()

      it "throws when subject is not in the document", (done) ->
        clicked = 0

        $checkbox = cy.$$(":checkbox:first").click (e) ->
          clicked += 1
          $checkbox.remove()
          return false

        cy.on "fail", (err) ->
          expect(clicked).to.eq 1
          expect(err.message).to.include "cy.click() failed because this element"
          done()

        cy.get(":checkbox:first").click().click()

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.click()

      it "throws when any member of the subject isnt visible", (done) ->
        cy.timeout(250)

        $btn = cy.$$("#three-buttons button").show().last().hide()

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(4)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "cy.click() failed because this element is not visible"
          done()

        cy.get("#three-buttons button").click({ multiple: true })

      it "throws when subject is disabled", (done) ->
        $btn = cy.$$("#button").prop("disabled", true)

        cy.on "fail", (err) =>
          ## get + click logs
          expect(@logs.length).eq(2)
          expect(err.message).to.include("cy.click() failed because this element is disabled:\n")
          done()

        cy.get("#button").click()

      it "throws when a non-descendent element is covering subject", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").prependTo(cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(cy.$$("body"))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          ## get + click logs
          expect(@logs.length).eq(2)
          expect(lastLog.get("error")).to.eq(err)

          ## there should still be 2 snapshots on error (before + after)
          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[1]).to.be.an("object")
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(err.message).to.include "cy.click() failed because this element"
          expect(err.message).to.include "is being covered by another element"

          clickLog = @logs[1]
          expect(clickLog.get("name")).to.eq("click")

          console = clickLog.invoke("consoleProps")
          expect(console["Tried to Click"]).to.eq $btn.get(0)
          expect(console["But its Covered By"]).to.eq span.get(0)

          done()

        cy.get("#button-covered-in-span").click()

      it "throws when non-descendent element is covering with fixed position", (done) ->
        $btn = $("<button>button covered</button>").attr("id", "button-covered-in-span").prependTo(cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "fixed", left: 0, top: 0, padding: 20, display: "inline-block", backgroundColor: "yellow").prependTo(cy.$$("body"))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          ## get + click logs
          expect(@logs.length).eq(2)
          expect(lastLog.get("error")).to.eq(err)

          ## there should still be 2 snapshots on error (before + after)
          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[1]).to.be.an("object")
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(err.message).to.include "cy.click() failed because this element"
          expect(err.message).to.include "is being covered by another element"

          console = lastLog.invoke("consoleProps")
          expect(console["Tried to Click"]).to.eq $btn.get(0)
          expect(console["But its Covered By"]).to.eq span.get(0)

          done()

        cy.get("#button-covered-in-span").click()

      it "throws when element is fixed position and being covered", (done) ->
        $btn = $("<button>button covered</button>")
        .attr("id", "button-covered-in-span")
        .css({position: "fixed", left: 0, top: 0})
        .prependTo(cy.$$("body"))

        $span = $("<span>span on button</span>")
        .css({position: "fixed", left: 0, top: 0, padding: 20, display: "inline-block", backgroundColor: "yellow", zIndex: 10})
        .prependTo(cy.$$("body"))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          ## get + click logs
          expect(@logs.length).eq(2)
          expect(lastLog.get("error")).to.eq(err)

          ## there should still be 2 snapshots on error (before + after)
          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[1]).to.be.an("object")
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(err.message).to.include "cy.click() failed because this element is not visible:"
          expect(err.message).to.include ">button ...</button>"
          expect(err.message).to.include "'<button#button-covered-in-span>' is not visible because it has CSS property: 'position: fixed' and its being covered"
          expect(err.message).to.include ">span on...</span>"

          console = lastLog.invoke("consoleProps")
          expect(console["Tried to Click"]).to.be.undefined
          expect(console["But its Covered By"]).to.be.undefined

          done()

        cy.get("#button-covered-in-span").click()

      it "throws when element is hidden and theres no element specifically covering it", (done) ->
        ## i cant come up with a way to easily make getElementAtCoordinates
        ## return null so we are just forcing it to return null to simulate
        ## the element being "hidden" so to speak but still displacing space

        cy.stub(Cypress.dom, "getElementAtPointFromViewport").returns(null)

        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.click() failed because the center of this element is hidden from view:"
          expect(err.message).to.include "<li>quux</li>"
          done()

        cy.get("#overflow-auto-container").contains("quux").click()

      it "throws when attempting to click a <select> element", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(2)
          expect(err.message).to.eq "cy.click() cannot be called on a <select> element. Use cy.select() command instead to change the value."
          done()

        cy.get("select:first").click()

      it "throws when provided invalid position", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(2)
          expect(err.message).to.eq "Invalid position argument: 'foo'. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight."
          done()

        cy.get("button:first").click("foo")

      it "throws when element animation exceeds timeout", (done) ->
        ## force the animation calculation to think we moving at a huge distance ;-)
        cy.stub(Cypress.utils, "getDistanceBetween").returns(100000)

        clicks = 0

        cy.$$("button:first").on "click", ->
          clicks += 1

        cy.on "fail", (err) ->
          expect(clicks).to.eq(0)
          expect(err.message).to.include("cy.click() could not be issued because this element is currently animating:\n")
          done()

        cy.get("button:first").click()

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get("button:first").click().should("have.class", "clicked")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(3)
          done()

        cy.get("button:first").click().should("have.class", "clicked")

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "logs immediately before resolving", (done) ->
        button = cy.$$("button:first")

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "click"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        cy.get("button:first").click()

      it "snapshots before clicking", (done) ->
        cy.$$("button:first").click =>
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[0].body).to.be.an("object")
          done()

        cy.get("button:first").click()

      it "snapshots after clicking", ->
        cy.get("button:first").click().then ($button) ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(lastLog.get("snapshots")[1].body).to.be.an("object")

      it "returns only the $el for the element of the subject that was clicked", ->
        clicks = []

        ## append two buttons
        button = -> $("<button class='clicks'>click</button>")
        cy.$$("body").append(button()).append(button())

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "click"
            clicks.push(log)

        cy.get("button.clicks").click({ multiple: true}).then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(clicks.length).to.eq(2)
          expect(clicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 click event", ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "click"
            logs.push(log)

        cy.get("button:first").click().then ->
          expect(logs.length).to.eq(1)

      it "passes in coords", ->
        cy.get("button").first().click().then ($btn) ->
          lastLog = @lastLog

          $btn.blur() ## blur which removes focus styles which would change coords
          { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)
          expect(lastLog.get("coords")).to.deep.eq(fromWindow)

      it "ends", ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "click"
            logs.push(log)

        cy.get("#three-buttons button").click({ multiple: true}).then ->
          _.each logs, (log) ->
            expect(log.get("state")).to.eq("passed")
            expect(log.get("ended")).to.be.true

      it "logs { multiple: true} options",  ->
        cy.get("span").invoke("slice", 0, 2).click({multiple: true, timeout: 1000}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "{multiple: true, timeout: 1000}"
          expect(lastLog.invoke("consoleProps").Options).to.deep.eq {multiple: true, timeout: 1000}

      it "#consoleProps", ->
        cy.get("button").first().click().then ($button) ->
          lastLog = @lastLog

          console   = lastLog.invoke("consoleProps")
          { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($button)
          logCoords = lastLog.get("coords")
          expect(logCoords.x).to.be.closeTo(fromWindow.x, 1) ## ensure we are within 1
          expect(logCoords.y).to.be.closeTo(fromWindow.y, 1) ## ensure we are within 1
          expect(console.Command).to.eq "click"
          expect(console["Applied To"]).to.eq lastLog.get("$el").get(0)
          expect(console.Elements).to.eq 1
          expect(console.Coords.x).to.be.closeTo(fromWindow.x, 1) ## ensure we are within 1
          expect(console.Coords.y).to.be.closeTo(fromWindow.y, 1) ## ensure we are within 1

      it "#consoleProps actual element clicked", ->
        $btn = $("<button>", {
          id: "button-covered-in-span"
        })
        .prependTo(cy.$$("body"))

        $span = $("<span>span in button</span>")
        .css({ padding: 5, display: "inline-block", backgroundColor: "yellow" })
        .appendTo($btn)

        cy.get("#button-covered-in-span").click().then ->
          expect(@lastLog.invoke("consoleProps")["Actual Element Clicked"]).to.eq $span.get(0)

      it "#consoleProps groups MouseDown", ->
        cy.$$("input:first").mousedown -> return false

        cy.get("input:first").click().then ->
          expect(@lastLog.invoke("consoleProps").groups()).to.deep.eq [
            {
              name: "MouseDown"
              items: {
                preventedDefault: true
                stoppedPropagation: true
              }
            },
            {
              name: "MouseUp"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            },
            {
              name: "Click"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            }
          ]

      it "#consoleProps groups MouseUp", ->
        cy.$$("input:first").mouseup -> return false

        cy.get("input:first").click().then ->
          expect(@lastLog.invoke("consoleProps").groups()).to.deep.eq [
            {
              name: "MouseDown"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            },
            {
              name: "MouseUp"
              items: {
                preventedDefault: true
                stoppedPropagation: true
              }
            },
            {
              name: "Click"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            }
          ]

      it "#consoleProps groups Click", ->
        cy.$$("input:first").click -> return false

        cy.get("input:first").click().then ->
          expect(@lastLog.invoke("consoleProps").groups()).to.deep.eq [
            {
              name: "MouseDown"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            },
            {
              name: "MouseUp"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            },
            {
              name: "Click"
              items: {
                preventedDefault: true
                stoppedPropagation: true
              }
            }
          ]

      it "#consoleProps groups have activated modifiers", ->
        cy.$$("input:first").click -> return false

        cy.get("input:first").type("{ctrl}{shift}", {release: false}).click().then ->
          expect(@lastLog.invoke("consoleProps").groups()).to.deep.eq [
            {
              name: "MouseDown"
              items: {
                preventedDefault: false
                stoppedPropagation: false
                modifiers: "ctrl, shift"
              }
            },
            {
              name: "MouseUp"
              items: {
                preventedDefault: false
                stoppedPropagation: false
                modifiers: "ctrl, shift"
              }
            },
            {
              name: "Click"
              items: {
                preventedDefault: true
                stoppedPropagation: true
                modifiers: "ctrl, shift"
              }
            }
          ]
          cy.get("body").type("{ctrl}") ## clear modifiers

      it "#consoleProps when no mouseup or click", ->
        $btn = cy.$$("button:first")

        $btn.on "mousedown", ->
          ## synchronously remove this button
          $(@).remove()

        cy.contains("button").click().then ->
          expect(@lastLog.invoke("consoleProps").groups()).to.deep.eq [
            {
              name: "MouseDown"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            }
          ]

      it "#consoleProps when no click", ->
        $btn = cy.$$("button:first")

        $btn.on "mouseup", ->
          ## synchronously remove this button
          $(@).remove()

        cy.contains("button").click().then ->
          expect(@lastLog.invoke("consoleProps").groups()).to.deep.eq [
            {
              name: "MouseDown"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            },
            {
              name: "MouseUp"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            }
          ]

      it "does not fire a click when element has been removed on mouseup", ->
        $btn = cy.$$("button:first")

        $btn.on "mouseup", ->
          ## synchronously remove this button
          $(@).remove()

        $btn.on "click", -> fail("should not have gotten click")

        cy.contains("button").click()

      it "logs deltaOptions", ->
        cy
          .get("button:first").click({force: true, timeout: 1000})
          .then ->
            lastLog = @lastLog

            expect(lastLog.get("message")).to.eq "{force: true, timeout: 1000}"
            expect(lastLog.invoke("consoleProps").Options).to.deep.eq {force: true, timeout: 1000}

  context "#dblclick", ->
    it "sends a dblclick event", (done) ->
      cy.$$("#button").dblclick (e) -> done()

      cy.get("#button").dblclick()

    it "returns the original subject", ->
      $btn = cy.$$("#button")

      cy.get("#button").dblclick().then ($button) ->
        expect($button).to.match $btn

    it "causes focusable elements to receive focus", (done) ->
      $text = cy.$$(":text:first")

      $text.focus -> done()

      cy.get(":text:first").dblclick()

    it "silences errors on unfocusable elements", ->
      cy.get("div:first").dblclick()

    it "causes first focused element to receive blur", ->
      blurred = false

      cy.$$("input:first").blur ->
        blurred = true

      cy
        .get("input:first").focus()
        .get("input:text:last").dblclick()
        .then ->
          expect(blurred).to.be.true

    it "inserts artificial delay of 50ms", ->
      cy.spy(Promise, "delay")

      cy.get("#button").click().then ->
        expect(Promise.delay).to.be.calledWith 50

    it "can operate on a jquery collection", ->
      dblclicks = 0

      $buttons = cy.$$("button").slice(0, 2)
      $buttons.dblclick ->
        dblclicks += 1
        return false

      ## make sure we have more than 1 button
      expect($buttons.length).to.be.gt 1

      ## make sure each button received its dblclick event
      cy.get("button").invoke("slice", 0, 2).dblclick().then ($buttons) ->
        expect($buttons.length).to.eq dblclicks

    ## TODO: fix this once we implement aborting / restoring / reset
    it.skip "can cancel multiple dblclicks", (done) ->
      dblclicks = 0

      spy = @sandbox.spy =>
        @Cypress.abort()

      ## abort after the 3rd dblclick
      dblclicked = _.after 3, spy

      anchors = cy.$$("#sequential-clicks a")
      anchors.dblclick ->
        dblclicks += 1
        dblclicked()

      ## make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte 5

      cy.on "cancel", =>
        ## timeout will get called synchronously
        ## again during a click if the click function
        ## is called
        timeout = @sandbox.spy cy, "_timeout"

        _.delay ->
          ## abort should only have been called once
          expect(spy.callCount).to.eq 1

          ## and we should have stopped dblclicking after 3
          expect(dblclicks).to.eq 3

          expect(timeout.callCount).to.eq 0

          done()
        , 200

      cy.get("#sequential-clicks a").dblclick()

    it "serially dblclicks a collection", ->
      dblclicks = 0

      ## create a throttled dblclick function
      ## which proves we are dblclicking serially
      throttled = _.throttle ->
        dblclicks += 1
      , 5, {leading: false}

      anchors = cy.$$("#sequential-clicks a")
      anchors.dblclick throttled

      ## make sure we're dblclicking multiple anchors
      expect(anchors.length).to.be.gt 1
      cy.get("#sequential-clicks a").dblclick().then ($anchors) ->
        expect($anchors.length).to.eq dblclicks

    it "increases the timeout delta after each dblclick", ->
      count = cy.$$("#three-buttons button").length

      cy.spy(cy, "timeout")

      cy.get("#three-buttons button").dblclick().then ->
        calls = cy.timeout.getCalls()

        num = _.filter calls, (call) ->
          _.isEqual(call.args, [50, true, "dblclick"])

        expect(num.length).to.eq(count)

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws when not a dom subject", (done) ->
        cy.on "fail", -> done()

        cy.dblclick()

      it "throws when subject is not in the document", (done) ->
        dblclicked = 0

        $button = cy.$$("button:first").dblclick (e) ->
          dblclicked += 1
          $button.remove()
          return false

        cy.on "fail", (err) ->
          expect(dblclicked).to.eq 1
          expect(err.message).to.include "cy.dblclick() failed because this element"
          done()

        cy.get("button:first").dblclick().dblclick()

      it "throws when any member of the subject isnt visible", (done) ->
        $btn = cy.$$("button").slice(0, 3).show().last().hide()

        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.dblclick() failed because this element is not visible"
          done()

        cy.get("button").invoke("slice", 0, 3).dblclick()

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.dblclick()

      it "throws when any member of the subject isnt visible", (done) ->
        $btn = cy.$$("#three-buttons button").show().last().hide()

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(4)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "cy.dblclick() failed because this element is not visible"
          done()

        cy.get("#three-buttons button").dblclick()

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "logs immediately before resolving", (done) ->
        $button = cy.$$("button:first")

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "dblclick"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq $button.get(0)
            done()

        cy.get("button:first").dblclick()

      it "snapshots after clicking", ->
        cy.get("button:first").dblclick().then ($button) ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "returns only the $el for the element of the subject that was dblclicked", ->
        dblclicks = []

        ## append two buttons
        $button = -> $("<button class='dblclicks'>dblclick</button")
        cy.$$("body").append($button()).append($button())

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "dblclick"
            dblclicks.push(log)

        cy.get("button.dblclicks").dblclick().then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(dblclicks.length).to.eq(2)
          expect(dblclicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 dblclick event", ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "dblclick"
            logs.push(log)

        cy.get("button:first").dblclick().then ->
          expect(logs.length).to.eq(1)

      it "#consoleProps", ->
        cy.on "log:added", (attrs, @log) =>

        cy.get("button").first().dblclick().then ($button) ->
          lastLog = @lastLog

          expect(lastLog.invoke("consoleProps")).to.deep.eq {
            Command: "dblclick"
            "Applied To": lastLog.get("$el").get(0)
            Elements: 1
          }

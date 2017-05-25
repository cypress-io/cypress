{ $, _, Promise } = window.testUtils

describe "$Cypress.Cy Clicking Commands", ->
  enterCommandTestingMode()

  context "#click", ->
    it "receives native click event", (done) ->
      btn = @cy.$$("#button")

      coords = @cy.getCoordinates(btn)

      btn.get(0).addEventListener "click", (e) =>
        obj = _.pick(e, "bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: @cy.privateState("window")
          clientX: coords.x - @cy.privateState("window").pageXOffset
          clientY: coords.y - @cy.privateState("window").pageYOffset
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
        done()

      @cy.get("#button").click()

    it "bubbles up native click event", (done) ->
      click = (e) =>
        @cy.privateState("window").removeEventListener "click", click
        done()

      @cy.privateState("window").addEventListener "click", click

      @cy.get("#button").click()

    it "sends native mousedown event", (done) ->
      btn = @cy.$$("#button")

      coords = @cy.getCoordinates(btn)

      win = @cy.privateState("window")

      btn.get(0).addEventListener "mousedown", (e) =>
        obj = _.pick(e, "bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: win
          clientX: coords.x - win.pageXOffset
          clientY: coords.y - win.pageYOffset
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
        done()

      @cy.get("#button").click()

    it "sends native mouseup event", (done) ->
      btn = @cy.$$("#button")

      coords = @cy.getCoordinates(btn)

      win = @cy.privateState("window")

      btn.get(0).addEventListener "mouseup", (e) =>
        obj = _.pick(e, "bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: win
          clientX: coords.x - win.pageXOffset
          clientY: coords.y - win.pageYOffset
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
        done()

      @cy.get("#button").click()

    it "sends mousedown, mouseup, click events in order", ->
      events = []

      btn = @cy.$$("#button")

      _.each "mousedown mouseup click".split(" "), (event) ->
        btn.get(0).addEventListener event, ->
          events.push(event)

      @cy.get("#button").click().then ->
        expect(events).to.deep.eq ["mousedown", "mouseup", "click"]

    it "records correct clientX when el scrolled", (done) ->
      btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo @cy.$$("body")

      coords = @cy.getCoordinates(btn)

      win = @cy.privateState("window")

      btn.get(0).addEventListener "click", (e) =>
        expect(win.pageXOffset).to.be.gt(0)
        expect(e.clientX).to.eq coords.x - win.pageXOffset
        done()

      @cy.get("#scrolledBtn").click()

    it "records correct clientY when el scrolled", (done) ->
      btn = $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>").appendTo @cy.$$("body")

      coords = @cy.getCoordinates(btn)

      win = @cy.privateState("window")

      btn.get(0).addEventListener "click", (e) =>
        expect(win.pageYOffset).to.be.gt(0)
        expect(e.clientY).to.eq coords.y - win.pageYOffset
        done()

      @cy.get("#scrolledBtn").click()

    it "will send all events even mousedown is defaultPrevented", ->
      events = []

      btn = @cy.$$("#button")

      btn.get(0).addEventListener "mousedown", (e) ->
        e.preventDefault()
        expect(e.defaultPrevented).to.be.true

      _.each "mouseup click".split(" "), (event) ->
        btn.get(0).addEventListener event, ->
          events.push(event)

      @cy.get("#button").click().then ->
        expect(events).to.deep.eq ["mouseup", "click"]

    it "sends a click event", (done) ->
      @cy.$$("#button").click -> done()

      @cy.get("#button").click()

    it "returns the original subject", ->
      button = @cy.$$("#button")

      @cy.get("#button").click().then ($button) ->
        expect($button).to.match button

    it "causes focusable elements to receive focus", (done) ->
      text = @cy.$$(":text:first")

      text.focus -> done()

      @cy.get(":text:first").click()

    it "does not fire a focus, mouseup, or click event when element has been removed on mousedown", (done) ->
      btn = @cy.$$("button:first")

      btn.on "mousedown", ->
        ## synchronously remove this button
        $(@).remove()

      btn.get(0).addEventListener "focus", -> done("should not have gotten focus")
      btn.get(0).addEventListener "focusin", -> done("should not have gotten focusin")
      btn.get(0).addEventListener "mouseup", -> done("should not have gotten mouseup")
      btn.get(0).addEventListener "click", -> done("should not have gotten click")

      @cy.contains("button").click().then -> done()

    it "does not fire a click when element has been removed on mouseup", (done) ->
      btn = @cy.$$("button:first")

      btn.on "mouseup", ->
        ## synchronously remove this button
        $(@).remove()

      btn.get(0).addEventListener "click", -> done("should not have gotten click")

      @cy.contains("button").click().then -> done()

    it "silences errors on unfocusable elements", ->
      div = @cy.$$("div:first")

      @cy.get("div:first").click({force: true})

    it "causes first focused element to receive blur", (done) ->
      @cy.$$("input:first").blur ->
        done()

      @cy
        .get("input:first").focus()
        .get("input:text:last").click()

    it "inserts artificial delay of 50ms", ->
      @cy.on "invoke:start", (cmd) =>
        if cmd.get("name") is "click"
          @delay = @sandbox.spy Promise, "delay"

      @cy.get("#button").click().then ->
        expect(@delay).to.be.calledWith 50

    it "delays 50ms before resolving", (done) ->
      waited = false

      @cy.$$("button:first").on "click", (e) =>
        _.delay ->
          waited = true
        , 50

        @cy.on "invoke:end", ->
          expect(waited).to.be.true
          done()

      @cy.get("button:first").click({multiple: true})

    it "can operate on a jquery collection", ->
      clicks = 0
      buttons = @cy.$$("button").slice(0, 3)
      buttons.click ->
        clicks += 1
        return false

      ## make sure we have more than 1 button
      expect(buttons.length).to.be.gt 1

      ## make sure each button received its click event
      @cy.get("button").invoke("slice", 0, 3).click({multiple: true}).then ($buttons) ->
        expect($buttons.length).to.eq clicks

    it "can cancel multiple clicks", (done) ->
      clicks = 0

      spy = @sandbox.spy =>
        @Cypress.abort()

      ## abort after the 3rd click
      clicked = _.after 3, spy

      anchors = @cy.$$("#sequential-clicks a")
      anchors.click ->
        clicks += 1
        clicked()

      ## make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte 5

      @cy.on "cancel", =>
        ## timeout will get called synchronously
        ## again during a click if the click function
        ## is called
        timeout = @sandbox.spy @cy, "_timeout"

        _.delay ->
          ## abort should only have been called once
          expect(spy.callCount).to.eq 1

          ## and we should have stopped clicking after 3
          expect(clicks).to.eq 3

          expect(timeout.callCount).to.eq 0

          done()
        , 200

      @cy.get("#sequential-clicks a").click({multiple: true})

    it "serially clicks a collection", ->
      clicks = 0

      ## create a throttled click function
      ## which proves we are clicking serially
      throttled = _.throttle ->
        clicks += 1
      , 5, {leading: false}

      anchors = @cy.$$("#sequential-clicks a")
      anchors.click throttled

      ## make sure we're clicking multiple anchors
      expect(anchors.length).to.be.gt 1
      @cy.get("#sequential-clicks a").click({multiple: true}).then ($anchors) ->
        expect($anchors.length).to.eq clicks

    it "increases the timeout delta after each click", (done) ->
      prevTimeout = @test.timeout()

      count = @cy.$$("#three-buttons button").length

      @cy.on "invoke:end", (cmd) =>
        if cmd.get("name") is "click"
          ## 100ms here because click + focus are each
          num = (count * 100) + prevTimeout
          expect(@test.timeout()).to.be.within(num, num + 100)
          done()

      @cy.get("#three-buttons button").click({multiple: true})

    it "can click elements which are hidden until scrolled within parent container", ->
      @cy.get("#overflow-auto-container").contains("quux").click()

    ## this test needs to increase the height + width of the div
    ## when we implement scrollBy the delta of the left/top
    it "can click elements which are huge and the center is naturally below the fold", ->
      @cy.get("#massively-long-div").click()

    it "can forcibly click even when being covered by another element", (done) ->
      btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").prependTo(@cy.$$("body"))
      span = $("<span>span on button</span>").css(position: "absolute", left: btn.offset().left, top: btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      btn.on "click", -> done()

      @cy.get("#button-covered-in-span").click({force: true})

    it "eventually clicks when covered up", ->
      btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").prependTo(@cy.$$("body"))
      span = $("<span>span on button</span>").css(position: "absolute", left: btn.offset().left, top: btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      retried = false

      @cy.on "retry", _.after 3, ->
        span.hide()
        retried = true

      @cy.get("#button-covered-in-span").click().then ->
        expect(retried).to.be.true

    it "waits until element becomes visible", ->
      btn = cy.$$("#button").hide()

      retried = false

      @cy.on "retry", _.after 3, ->
        btn.show()
        retried = true

      @cy.get("#button").click().then ->
        expect(retried).to.be.true

    it "waits until element is no longer disabled", ->
      btn = cy.$$("#button").prop("disabled", true)

      retried = false
      clicks = 0

      btn.on "click", ->
        clicks += 1

      @cy.on "retry", _.after 3, ->
        btn.prop("disabled", false)
        retried = true

      @cy.get("#button").click().then ->
        expect(clicks).to.eq(1)
        expect(retried).to.be.true

    it "waits until element stops animating", (done) ->
      retries = []
      clicks  = 0

      p = $("<p class='slidein'>sliding in</p>")
      p.on "click", -> clicks += 1
      p.css("animation-duration", ".5s")

      @cy.on "retry", (obj) ->
        expect(clicks).to.eq(0)
        retries.push(obj)

      p.on "animationstart", =>
        t = Date.now()
        _.delay =>
          @cy.get(".slidein").click({interval: 30}).then ->
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

      @cy.get(".slidein").click()

    it "does not throw when turning off waitForAnimations in options", ->
      @cy._timeout(100)

      p = $("<p class='slidein'>sliding in</p>")
      p.css("animation-duration", ".5s")

      @cy.$$("#animation-container").append(p)

      @cy.get(".slidein").click({waitForAnimations: false})

    it "does not throw when setting animationDistanceThreshold extremely high in options", ->
      @cy._timeout(100)

      p = $("<p class='slidein'>sliding in</p>")
      p.css("animation-duration", ".5s")

      @cy.$$("#animation-container").append(p)

      @cy.get(".slidein").click({animationDistanceThreshold: 1000})

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
        @cy.$$("button:first").click ->
          _.delay =>
            $(@).addClass("clicked")
          , 50
          return false

        @cy.get("button:first").click().should("have.class", "clicked").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

      it "eventually passes the assertion on multiple buttons", ->
        @cy.$$("button").click ->
          _.delay =>
            $(@).addClass("clicked")
          , 50
          return false

        @cy.get("button").invoke("slice", 0, 2).click({multiple: true}).should("have.class", "clicked")

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get("button:first").click().should("have.class", "clicked")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get("button:first").click().should("have.class", "clicked")

    describe "position argument", ->
      it "can click center by default", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 30, top: btn.offset().top + 40, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click()

      it "can click topLeft", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left, top: btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("topLeft")

      it "can click top", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 30, top: btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("top")

      it "can click topRight", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 80, top: btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("topRight")

      it "can click left", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left, top: btn.offset().top + 40, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("left")

      it "can click center", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 30, top: btn.offset().top + 40, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("center")

      it "can click right", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 80, top: btn.offset().top + 40, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("right")


      it "can click bottomLeft", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left, top: btn.offset().top + 80, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("bottomLeft")

      it "can click bottom", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 30, top: btn.offset().top + 80, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("bottom")

      it "can click bottomRight", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 80, top: btn.offset().top + 80, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("bottomRight")

      it "can pass options along with position", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 80, top: btn.offset().top + 80, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(@cy.$$("body"))

        btn.on "click", -> done()

        @cy.get("#button-covered-in-span").click("bottomRight", {force: true})

    describe "relative coordinate arguments", ->
      it "can specify x and y", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 50, top: btn.offset().top + 65, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click(75, 78)

      it "can pass options along with x, y", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 50, top: btn.offset().top + 65, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(@cy.$$("body"))

        btn.on "click", -> done()

        @cy.get("#button-covered-in-span").click(75, 78, {force: true})

    describe "mousedown", ->
      it "gives focus after mousedown", (done) ->
        input = @cy.$$("input:first")

        input.get(0).addEventListener "focus", (e) =>
          obj = _.pick(e, "bubbles", "cancelable", "view", "which", "relatedTarget", "detail", "type")
          expect(obj).to.deep.eq {
            bubbles: false
            cancelable: false
            view: @cy.privateState("window")
            ## chrome no longer fires pageX and pageY
            # pageX: 0
            # pageY: 0
            which: 0
            relatedTarget: null
            detail: 0
            type: "focus"
          }
          done()

        @cy.get("input:first").click()

      it "gives focusin after mousedown", (done) ->
        input = @cy.$$("input:first")

        input.get(0).addEventListener "focusin", (e) =>
          obj = _.pick(e, "bubbles", "cancelable", "view", "which", "relatedTarget", "detail", "type")
          expect(obj).to.deep.eq {
            bubbles: true
            cancelable: false
            view: @cy.privateState("window")
            # pageX: 0
            # pageY: 0
            which: 0
            relatedTarget: null
            detail: 0
            type: "focusin"
          }
          done()

        @cy.get("input:first").click()

      it "gives all events in order", ->
        events = []

        input = @cy.$$("input:first")

        _.each "focus focusin mousedown mouseup click".split(" "), (event) ->
          input.get(0).addEventListener event, ->
            events.push(event)

        @cy.get("input:first").click().then ->
          expect(events).to.deep.eq ["mousedown", "focus", "focusin", "mouseup", "click"]

      it "does not give focus if mousedown is defaultPrevented", (done) ->
        input = @cy.$$("input:first")

        input.get(0).addEventListener "focus", (e) ->
          done("should not have recieved focused event")

        input.get(0).addEventListener "mousedown", (e) ->
          e.preventDefault()
          expect(e.defaultPrevented).to.be.true

        @cy.get("input:first").click().then -> done()

      it "still gives focus to the focusable element even when click is issued to child element", ->
        btn  = $("<button>", id: "button-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span in button</span>").css(padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        @cy
          .get("#button-covered-in-span").click()
          .focused().should("have.id", "button-covered-in-span")

      it "will give focus to the window if no element is focusable", (done) ->
        $(@cy.privateState("window")).on "focus", -> done()

        @cy.get("#nested-find").click()

      # it "events", ->
      #   btn = @cy.$$("button")
      #   win = $(@cy.privateState("window"))

      #   _.each {"btn": btn, "win": win}, (type, key) ->
      #     _.each "focus mousedown mouseup click".split(" "), (event) ->
      #     # _.each "focus focusin focusout mousedown mouseup click".split(" "), (event) ->
      #       type.get(0).addEventListener event, (e) ->
      #         if key is "btn"
      #           # e.preventDefault()
      #           e.stopPropagation()

      #         console.log "#{key} #{event}", e

        # btn.on "mousedown", (e) ->
          # console.log("btn mousedown")
          # e.preventDefault()

        # win.on "mousedown", -> console.log("win mousedown")

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.click()

      it "throws when attempting to click multiple elements", (done) ->
        num = @cy.$$("button").length

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.click() can only be called on a single element. Your subject contained 14 elements. Pass {multiple: true} if you want to serially click each element."
          done()

        @cy.get("button").click()

      it "throws when subject is not in the document", (done) ->
        clicked = 0

        checkbox = @cy.$$(":checkbox:first").click (e) ->
          clicked += 1
          checkbox.remove()
          return false

        @cy.on "fail", (err) ->
          expect(clicked).to.eq 1
          expect(err.message).to.include "cy.click() failed because this element"
          done()

        @cy.get(":checkbox:first").click().click()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.click()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = @cy.$$("#three-buttons button").show().last().hide()

        node = $Cypress.utils.stringifyElement(btn)

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(4)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.click() failed because this element is not visible"
          done()

        @cy.get("#three-buttons button").click({multiple: true})

      it "throws when subject is disabled", (done) ->
        btn = @cy.$$("#button").prop("disabled", true)

        logs = []

        @Cypress.on "log", (attrs, log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          ## get + click logs
          expect(logs.length).eq(2)
          expect(err.message).to.include("cy.click() failed because this element is disabled:\n")
          done()

        @cy.get("#button").click()

      it "throws when a non-descendent element is covering subject", (done) ->
        @cy._timeout(200)

        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: btn.offset().left, top: btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

        logs = []

        node = @Cypress.utils.stringifyElement(span)

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          ## get + click logs
          expect(logs.length).eq(2)
          expect(@log.get("error")).to.eq(err)

          ## there should still be 2 snapshots on error (before + after)
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[0]).to.be.an("object")
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[1]).to.be.an("object")
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(err.message).to.include "cy.click() failed because this element"
          expect(err.message).to.include "is being covered by another element"

          console = @log.attributes.consoleProps()
          expect(console["Tried to Click"]).to.eq btn.get(0)
          expect(console["But its Covered By"]).to.eq span.get(0)

          done()

        @cy.get("#button-covered-in-span").click()

      it "throws when non-descendent element is covering with fixed position", (done) ->
        @cy._timeout(200)

        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "fixed", left: 0, top: 0, padding: 20, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

        logs = []

        node = @Cypress.utils.stringifyElement(span)

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          ## get + click logs
          expect(logs.length).eq(2)
          expect(@log.get("error")).to.eq(err)

          ## there should still be 2 snapshots on error (before + after)
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[0]).to.be.an("object")
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[1]).to.be.an("object")
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(err.message).to.include "cy.click() failed because this element"
          expect(err.message).to.include "is being covered by another element"

          console = @log.attributes.consoleProps()
          expect(console["Tried to Click"]).to.eq btn.get(0)
          expect(console["But its Covered By"]).to.eq span.get(0)

          done()

        @cy.get("#button-covered-in-span").click()

      it "throws when element is hidden and theres no element specifically covering it", (done) ->
        ## i cant come up with a way to easily make getElementAtCoordinates
        ## return null so we are just forcing it to return null to simulate
        ## the element being "hidden" so to speak but still displacing space
        @cy._timeout(200)

        @sandbox.stub(@cy, "getElementAtCoordinates").returns(null)

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.click() failed because the center of this element is hidden from view:"
          expect(err.message).to.include "<li>quux</li>"
          done()

        @cy.get("#overflow-auto-container").contains("quux").click()

      it "throws when attempting to click a <select> element", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(2)
          expect(err.message).to.eq "cy.click() cannot be called on a <select> element. Use cy.select() command instead to change the value."
          done()

        @cy.get("select:first").click()

      it "throws when provided invalid position", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(2)
          expect(err.message).to.eq "Invalid position argument: 'foo'. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight."
          done()

        @cy.get("button:first").click("foo")

      it "throws when element animation exceeds timeout", (done) ->
        @cy._timeout(100)

        clicks = 0

        @cy.on "fail", (err) ->
          expect(clicks).to.eq(0)
          expect(err.message).to.include("cy.click() could not be issued because this element is currently animating:\n")
          done()

        p = $("<p class='slidein'>sliding in</p>")
        p.css("animation-duration", ".5s")
        p.on "click", ->
          clicks += 1
        p.on "animationstart", =>
          Promise.delay(50)
          .then =>
            @cy.get(".slidein").click({interval: 50, animationDistanceThreshold: 0})

        @cy.$$("#animation-container").append(p)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately before resolving", (done) ->
        button = @cy.$$("button:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "click"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        @cy.get("button:first").click()

      it "snapshots before clicking", (done) ->
        @cy.$$("button:first").click =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].body).to.be.an("object")
          done()

        @cy.get("button:first").click()

      it "snapshots after clicking", ->
        @cy.get("button:first").click().then ($button) ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].body).to.be.an("object")

      it "returns only the $el for the element of the subject that was clicked", ->
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

      it "logs only 1 click event", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log) if log.get("name") is "click"

        @cy.get("button:first").click().then ->
          expect(logs).to.have.length(1)

      it "passes in coords", ->
        @cy.get("button").first().click().then ($btn) ->
          $btn.blur() ## blur which removes focus styles which would change coords
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

      it "logs {multiple: true} options", ->
        @cy.get("span").invoke("slice", 0, 2).click({multiple: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{multiple: true, timeout: 1000}"
          expect(@log.attributes.consoleProps().Options).to.deep.eq {multiple: true, timeout: 1000}

      it "#consoleProps", ->
        @cy.get("button").first().click().then ($button) ->
          console   = @log.attributes.consoleProps()
          coords    = @cy.getCoordinates($button)
          logCoords = @log.get("coords")
          expect(logCoords.x).to.be.closeTo(coords.x, 1) ## ensure we are within 1
          expect(logCoords.y).to.be.closeTo(coords.y, 1) ## ensure we are within 1
          expect(console.Command).to.eq "click"
          expect(console["Applied To"]).to.eq @log.get("$el").get(0)
          expect(console.Elements).to.eq 1
          expect(console.Coords.x).to.be.closeTo(coords.x, 1) ## ensure we are within 1
          expect(console.Coords.y).to.be.closeTo(coords.y, 1) ## ensure we are within 1

      it "#consoleProps actual element clicked", ->
        btn  = $("<button>", id: "button-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span in button</span>").css(padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        @cy.get("#button-covered-in-span").click().then ->
          expect(@log.attributes.consoleProps()["Actual Element Clicked"]).to.eq span.get(0)

      it "#consoleProps groups MouseDown", ->
        @cy.$$("input:first").mousedown -> return false

        @cy.get("input:first").click().then ->
          expect(@log.attributes.consoleProps().groups()).to.deep.eq [
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
        @cy.$$("input:first").mouseup -> return false

        @cy.get("input:first").click().then ->
          expect(@log.attributes.consoleProps().groups()).to.deep.eq [
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
        @cy.$$("input:first").click -> return false

        @cy.get("input:first").click().then ->
          expect(@log.attributes.consoleProps().groups()).to.deep.eq [
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
        @cy.$$("input:first").click -> return false

        @cy.get("input:first").type("{ctrl}{shift}", {release: false}).click().then ->
          expect(@log.attributes.consoleProps().groups()).to.deep.eq [
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
          @cy.get("body").type("{ctrl}") ## clear modifiers

      it "#consoleProps when no mouseup or click", ->
        btn = @cy.$$("button:first")

        btn.on "mousedown", ->
          ## synchronously remove this button
          $(@).remove()

        @cy.contains("button").click().then ->
          expect(@log.attributes.consoleProps().groups()).to.deep.eq [
            {
              name: "MouseDown"
              items: {
                preventedDefault: false
                stoppedPropagation: false
              }
            }
          ]

      it "#consoleProps when no click", ->
        btn = @cy.$$("button:first")

        btn.on "mouseup", ->
          ## synchronously remove this button
          $(@).remove()

        @cy.contains("button").click().then ->
          expect(@log.attributes.consoleProps().groups()).to.deep.eq [
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

      it "does not fire a click when element has been removed on mouseup", (done) ->
        btn = @cy.$$("button:first")

        btn.on "mouseup", ->
          ## synchronously remove this button
          $(@).remove()

        btn.get(0).addEventListener "click", -> done("should not have gotten click")

        @cy.contains("button").click().then -> done()

      it "logs deltaOptions", ->
        @cy.get("button:first").click({force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(@log.attributes.consoleProps().Options).to.deep.eq {force: true, timeout: 1000}

  context "#dblclick", ->
    it "sends a dblclick event", (done) ->
      @cy.$$("#button").dblclick (e) -> done()

      @cy.get("#button").dblclick()

    it "returns the original subject", ->
      button = @cy.$$("#button")

      @cy.get("#button").dblclick().then ($button) ->
        expect($button).to.match button

    it "causes focusable elements to receive focus", (done) ->
      text = @cy.$$(":text:first")

      text.focus -> done()

      @cy.get(":text:first").dblclick()

    it "silences errors on unfocusable elements", ->
      div = @cy.$$("div:first")

      @cy.get("div:first").dblclick()

    it "causes first focused element to receive blur", (done) ->
      @cy.$$("input:first").blur ->
        done()

      @cy
        .get("input:first").focus()
        .get("input:text:last").dblclick()

    it "inserts artificial delay of 50ms", ->
      @cy.on "invoke:start", (cmd) =>
        if cmd.get("name") is "dblclick"
          @delay = @sandbox.spy Promise.prototype, "delay"

      @cy.get("#button").dblclick().then ->
        expect(@delay).to.be.calledWith 50

    it "can operate on a jquery collection", ->
      dblclicks = 0
      buttons = @cy.$$("button").slice(0, 2)
      buttons.dblclick ->
        dblclicks += 1
        return false

      ## make sure we have more than 1 button
      expect(buttons.length).to.be.gt 1

      ## make sure each button received its dblclick event
      @cy.get("button").invoke("slice", 0, 2).dblclick().then ($buttons) ->
        expect($buttons.length).to.eq dblclicks

    it "can cancel multiple dblclicks", (done) ->
      dblclicks = 0

      spy = @sandbox.spy =>
        @Cypress.abort()

      ## abort after the 3rd dblclick
      dblclicked = _.after 3, spy

      anchors = @cy.$$("#sequential-clicks a")
      anchors.dblclick ->
        dblclicks += 1
        dblclicked()

      ## make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte 5

      @cy.on "cancel", =>
        ## timeout will get called synchronously
        ## again during a click if the click function
        ## is called
        timeout = @sandbox.spy @cy, "_timeout"

        _.delay ->
          ## abort should only have been called once
          expect(spy.callCount).to.eq 1

          ## and we should have stopped dblclicking after 3
          expect(dblclicks).to.eq 3

          expect(timeout.callCount).to.eq 0

          done()
        , 200

      @cy.get("#sequential-clicks a").dblclick()

    it "serially dblclicks a collection", ->
      dblclicks = 0

      ## create a throttled dblclick function
      ## which proves we are dblclicking serially
      throttled = _.throttle ->
        dblclicks += 1
      , 5, {leading: false}

      anchors = @cy.$$("#sequential-clicks a")
      anchors.dblclick throttled

      ## make sure we're dblclicking multiple anchors
      expect(anchors.length).to.be.gt 1
      @cy.get("#sequential-clicks a").dblclick().then ($anchors) ->
        expect($anchors.length).to.eq dblclicks

    it "increases the timeout delta after each dblclick", (done) ->
      prevTimeout = @test.timeout()

      count = @cy.$$("button").slice(0, 3).length

      @cy.on "invoke:end", (cmd) =>
        if cmd.get("name") is "dblclick"
          ## 100 here because dbclick + focus each are 50ms
          num = (count * 100) + prevTimeout
          expect(@test.timeout()).to.be.within(num, num + 100)
          done()

      @cy.get("button").invoke("slice", 0, 3).dblclick()

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.dblclick()

      it "throws when subject is not in the document", (done) ->
        dblclicked = 0

        button = @cy.$$("button:first").dblclick (e) ->
          dblclicked += 1
          button.remove()
          return false

        @cy.on "fail", (err) ->
          expect(dblclicked).to.eq 1
          expect(err.message).to.include "cy.dblclick() failed because this element"
          done()

        @cy.get("button:first").dblclick().dblclick()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = @cy.$$("button").show().last().hide()

        node = $Cypress.utils.stringifyElement(btn)

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.dblclick() failed because this element is not visible"
          done()

        @cy.get("button").dblclick()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.dblclick()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = @cy.$$("#three-buttons button").show().last().hide()

        node = $Cypress.utils.stringifyElement(btn)

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(4)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.dblclick() failed because this element is not visible"
          done()

        @cy.get("#three-buttons button").dblclick()

    describe ".log", ->
      it "logs immediately before resolving", (done) ->
        button = @cy.$$("button:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "dblclick"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        @cy.get("button:first").dblclick()

      it "snapshots after clicking", ->
        @Cypress.on "log", (attrs, @log) =>

        @cy.get("button:first").dblclick().then ($button) ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "returns only the $el for the element of the subject that was dblclicked", ->
        dblclicks = []

        ## append two buttons
        button = -> $("<button class='dblclicks'>dblclick</button")
        @cy.$$("body").append(button()).append(button())

        @Cypress.on "log", (attrs, log) ->
          dblclicks.push(log) if log.get("name") is "dblclick"

        @cy.get("button.dblclicks").dblclick().then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(dblclicks.length).to.eq(2)
          expect(dblclicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 dblclick event", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log) if log.get("name") is "dblclick"

        @cy.get("button:first").dblclick().then ->
          expect(logs).to.have.length(1)

      it "#consoleProps", ->
        @Cypress.on "log", (attrs, @log) =>

        @cy.get("button").first().dblclick().then ($button) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "dblclick"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
          }

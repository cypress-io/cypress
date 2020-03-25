$ = Cypress.$Cypress.$
_ = Cypress._

describe "src/cy/commands/actions/scroll", ->
  before ->
    cy
      .visit("/fixtures/scrolling.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

    cy.viewport(600, 200)

  context "#scrollTo", ->
    beforeEach ->
      @win          = cy.state("window")
      @scrollVert   = cy.$$("#scroll-to-vertical")
      @scrollHoriz  = cy.$$("#scroll-to-horizontal")
      @scrollBoth   = cy.$$("#scroll-to-both")

      ## reset the scrollable containers back
      ## to furthest left and top
      @win.scrollTop           = 0
      @win.scrollLeft          = 0

      @scrollVert.scrollTop    = 0
      @scrollVert.scrollLeft   = 0

      @scrollHoriz.scrollTop   = 0
      @scrollHoriz.scrollLeft  = 0

      @scrollBoth.scrollTop    = 0
      @scrollBoth.scrollLeft   = 0

    describe "subject", ->
      it "is window by default", ->
        cy.scrollTo("125px").then (win2) ->
          expect(@win).to.eq(win2)

      it "is DOM", ->
        cy.get("#scroll-to-vertical").scrollTo("125px").then ($el) ->
          expect($el.get(0)).to.eq @scrollVert.get(0)

      it "can use window", ->
        cy.window().scrollTo("10px").then (win) ->
          expect(win.scrollX).to.eq(10)

      it "can handle window w/length > 1 as a subject", ->
        cy.visit('/fixtures/dom.html')
        cy.window().should('have.length.gt', 1)
        .scrollTo('10px')

    describe "x axis only", ->
      it "scrolls x axis to num px", ->
        expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(@scrollHoriz.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-horizontal").scrollTo(300).then ($el) ->
          expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
          expect(@scrollHoriz.get(0).scrollLeft).to.eq(300)

      it "scrolls x axis to px", ->
        expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(@scrollHoriz.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-horizontal").scrollTo("125px").then ($el) ->
          expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
          expect(@scrollHoriz.get(0).scrollLeft).to.eq(125)

      it "scrolls x axis by % of scrollable height", ->
        expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(@scrollHoriz.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-horizontal").scrollTo("50%").then ($el) ->
          ## they don't calculate the height of the container
          ## in the percentage of the scroll (since going the height
          ## of the container wouldn't scroll at all...)
          expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
          expect(@scrollHoriz.get(0).scrollLeft).to.eq((500-100)/2)

    describe "position arguments", ->
      it "scrolls x/y axis to topLeft", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("topLeft").then () ->
          expect(@scrollBoth.get(0).scrollTop).to.eq(0)
          expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

      it "scrolls x/y axis to top", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("top").then () ->
          expect(@scrollBoth.get(0).scrollTop).to.eq(0)
          expect(@scrollBoth.get(0).scrollLeft).to.eq((500-100)/2)

      it "scrolls x/y axis to topRight", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("topRight").then () ->
          expect(@scrollBoth.get(0).scrollTop).to.eq(0)
          expect(@scrollBoth.get(0).scrollLeft).to.eq((500-100))

      it "scrolls x/y axis to left", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("left").then () ->
          expect(@scrollBoth.get(0).scrollTop).to.eq((500-100)/2)
          expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

      it "scrolls x/y axis to center", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("center").then () ->
          expect(@scrollBoth.get(0).scrollTop).to.eq((500-100)/2)
          expect(@scrollBoth.get(0).scrollLeft).to.eq((500-100)/2)

      it "scrolls x/y axis to right", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("right").then () ->
          expect(@scrollBoth.get(0).scrollTop).to.eq((500-100)/2)
          expect(@scrollBoth.get(0).scrollLeft).to.eq((500-100))

      it "scrolls x/y axis to bottomLeft", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("bottomLeft").then () ->
          expect(@scrollBoth.get(0).scrollTop).to.eq((500-100))
          expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

      it "scrolls x/y axis to bottom", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("bottom").then () ->
          expect(@scrollBoth.get(0).scrollTop).to.eq((500-100))
          expect(@scrollBoth.get(0).scrollLeft).to.eq((500-100)/2)

      it "scrolls x/y axis to bottomRight", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("bottomRight").then () ->
          expect(@scrollBoth.get(0).scrollTop).to.eq((500-100))
          expect(@scrollBoth.get(0).scrollLeft).to.eq((500-100))

    describe "scroll both axis", ->
      it "scrolls both x and y axis num of px", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo(300, 150).then ($el) ->
          expect(@scrollBoth.get(0).scrollTop).to.eq(150)
          expect(@scrollBoth.get(0).scrollLeft).to.eq(300)

      it "scrolls x to 0 and y num of px", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo(0, 150).then ($el) ->
          expect(@scrollBoth.get(0).scrollTop).to.eq(150)
          expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

      it "scrolls x num of px and y to 0 ", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo(150, 0).then ($el) ->
          expect(@scrollBoth.get(0).scrollTop).to.eq(0)
          expect(@scrollBoth.get(0).scrollLeft).to.eq(150)

      it "scrolls both x and y axis of px", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("300px", "150px").then ($el) ->
          expect(@scrollBoth.get(0).scrollTop).to.eq(150)
          expect(@scrollBoth.get(0).scrollLeft).to.eq(300)

      it "scrolls both x and y axis of percentage", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("50%", "50%").then ($el) ->
          expect(@scrollBoth.get(0).scrollTop).to.eq((500-100)/2)
          expect(@scrollBoth.get(0).scrollLeft).to.eq((500-100)/2)

      it "scrolls x to 0 and y percentage", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("0%", "50%").then ($el) ->
          expect(@scrollBoth.get(0).scrollTop).to.eq((500-100)/2)
          expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

      it "scrolls x to percentage and y to 0", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get("#scroll-to-both").scrollTo("50%", "0%").then ($el) ->
          expect(@scrollBoth.get(0).scrollTop).to.eq(0)
          expect(@scrollBoth.get(0).scrollLeft).to.eq((500-100)/2)

    describe "scrolls with options", ->
      it "calls jQuery scroll to", ->
        scrollTo = cy.spy($.fn, "scrollTo")

        cy.get("#scroll-to-both").scrollTo("25px").then ->
          expect(scrollTo).to.be.calledWith({left: "25px", top: 0})

      it "sets duration to 0 by default", ->
        scrollTo = cy.spy($.fn, "scrollTo")

        cy.get("#scroll-to-both").scrollTo("25px").then ->
          expect(scrollTo).to.be.calledWithMatch({}, {duration: 0})

      it "sets axis to correct xy", ->
        scrollTo = cy.spy($.fn, "scrollTo")

        cy.get("#scroll-to-both").scrollTo("25px", "80px").then ->
          expect(scrollTo).to.be.calledWithMatch({}, {axis: "xy"})

      it "scrolling resolves after a set duration", ->
        expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(@scrollHoriz.get(0).scrollLeft).to.eq(0)

        scrollTo = cy.spy($.fn, "scrollTo")

        cy.get("#scroll-to-horizontal").scrollTo("125px", {duration: 500}).then ->
          expect(scrollTo).to.be.calledWithMatch({}, {duration: 500})
          expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
          expect(@scrollHoriz.get(0).scrollLeft).to.eq(125)

      it "accepts duration string option", ->
        scrollTo = cy.spy($.fn, "scrollTo")

        cy.get("#scroll-to-both").scrollTo("25px", {duration: "500"}).then ->
          expect(scrollTo.args[0][1].duration).to.eq "500"

      it "has easing set to swing by default", ->
        scrollTo = cy.spy($.fn, "scrollTo")

        cy.get("#scroll-to-both").scrollTo("25px").then ->
          expect(scrollTo.args[0][1].easing).to.eq "swing"

      it "scrolling resolves after easing", ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(0)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

        scrollTo = cy.spy($.fn, "scrollTo")

        cy.get("#scroll-to-both").scrollTo("25px", "50px", {easing: "linear"}).then ->
          expect(scrollTo).to.be.calledWithMatch({}, {easing: "linear"})
          expect(@scrollBoth.get(0).scrollTop).to.eq(50)
          expect(@scrollBoth.get(0).scrollLeft).to.eq(25)

      it "retries until element is scrollable", ->
        $container = cy.$$("#nonscroll-becomes-scrollable")

        expect($container.get(0).scrollTop).to.eq(0)
        expect($container.get(0).scrollLeft).to.eq(0)

        retried = false

        cy.on "command:retry", _.after 2, ->
          $container.css("overflow", "scroll")
          retried = true

        cy.get("#nonscroll-becomes-scrollable").scrollTo(500, 300).then ->
          expect(retried).to.be.true
          expect($container.get(0).scrollTop).to.eq(300)
          expect($container.get(0).scrollLeft).to.eq(500)

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.on "command:retry", _.after 2, ->
          cy.$$("#scroll-into-view-horizontal").addClass("scrolled")

        cy
          .get("#scroll-into-view-horizontal")
          .scrollTo("right")
          .should("have.class", "scrolled").then ->
            lastLog = @lastLog

            expect(lastLog.get("name")).to.eq("assert")
            expect(lastLog.get("state")).to.eq("passed")
            expect(lastLog.get("ended")).to.be.true

      it "waits until the subject is scrollable", ->
        cy.stub(cy, "ensureScrollability")
        .onFirstCall().throws(new Error())

        cy.on "command:retry", ->
          cy.ensureScrollability.returns()

        cy
          .get("#scroll-into-view-horizontal")
          .scrollTo("right").then ->
            expect(cy.ensureScrollability).to.be.calledTwice

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws when subject isn't scrollable", (done) ->
        cy.on "fail", (err) =>
          expect(err.message).to.include "`cy.scrollTo()` failed because this element is not scrollable:"
          done()

        cy.get("button:first").scrollTo("bottom")

      context "subject errors", ->
        it "throws when not passed DOM element as subject", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollTo()` failed because it requires a DOM element."
            expect(err.message).to.include "{foo: bar}"
            expect(err.message).to.include "> `cy.noop()`"
            done()

          cy.noop({foo: "bar"}).scrollTo("250px")

        it "throws if scrollable container is multiple elements", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollTo()` can only be used to scroll 1 element, you tried to scroll 2 elements."
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto")
            done()

          cy.get("button").scrollTo("500px")

      context "argument errors", ->
        it "throws if no args passed", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollTo()` must be called with a valid `position`. It can be a string, number or object."
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto")
            done()

          cy.scrollTo()

        it "throws if NaN", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollTo()` must be called with a valid `position`. It can be a string, number or object. Your position was: `25, NaN`"
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto")
            done()

          cy.get("#scroll-to-both").scrollTo(25, 0/0)

        it "throws if Infinity", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollTo()` must be called with a valid `position`. It can be a string, number or object. Your position was: `25, Infinity`"
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto")
            done()

          cy.get("#scroll-to-both").scrollTo(25, 10/0)

        it "throws if unrecognized position", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "Invalid position argument: `botom`. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight."
            done()

          cy.get("#scroll-to-both").scrollTo("botom")

      context "option errors", ->
        it "throws if duration is not a number or valid string", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollTo()` must be called with a valid `duration`. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: `foo`"
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto")
            done()

          cy.get("#scroll-to-both").scrollTo("25px", { duration: "foo" })

        it "throws if unrecognized easing", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollTo()` must be called with a valid `easing`. Your easing was: `flower`"
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollto")
            done()

          cy.get("#scroll-to-both").scrollTo("25px", { easing: "flower" })

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "logs out scrollTo", ->
        cy.get("#scroll-to-both").scrollTo(25).then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq "scrollTo"

      it "passes in $el if child command", ->
        cy.get("#scroll-to-both").scrollTo(25).then ($container) ->
          lastLog = @lastLog

          expect(lastLog.get("$el").get(0)).to.eq $container.get(0)

      it "passes undefined in $el if parent command", ->
        cy.scrollTo(25).then ($container) ->
          lastLog = @lastLog

          expect(lastLog.get("$el")).to.be.undefined

      it "logs duration options", ->
        cy.get("#scroll-to-both").scrollTo(25, { duration: 1 }).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "25, 0, {duration: 1}"

      it "logs easing options", ->
        cy.get("#scroll-to-both").scrollTo(25, { easing: 'linear' }).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "25, 0, {easing: linear}"

      it "snapshots immediately", ->
        cy.get("#scroll-to-both").scrollTo(25, { duration: 1 }).then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "#consoleProps", ->
        cy.get("#scroll-to-both").scrollTo(25, {duration: 1}).then ($container) ->
          console = @lastLog.invoke("consoleProps")
          expect(console.Command).to.eq("scrollTo")
          expect(console.X).to.eq(25)
          expect(console.Y).to.eq(0)
          expect(console.Options).to.eq("{duration: 1}")
          expect(console["Scrolled Element"]).to.eq $container.get(0)

  context "#scrollIntoView", ->
    beforeEach ->
      @win          = cy.state("window")
      @scrollVert   = cy.$$("#scroll-into-view-vertical")
      @scrollHoriz  = cy.$$("#scroll-into-view-horizontal")
      @scrollBoth   = cy.$$("#scroll-into-view-both")

      ## reset the scrollable containers back
      ## to furthest left and top
      @win.scrollTo(0, 0)

      @scrollVert.scrollTop(0)
      @scrollVert.scrollLeft(0)

      @scrollHoriz.scrollTop(0)
      @scrollHoriz.scrollLeft(0)

      @scrollBoth.scrollTop(0)
      @scrollBoth.scrollLeft(0)

    it "does not change the subject", ->
      div = cy.$$("#scroll-into-view-vertical div")

      cy.get("#scroll-into-view-vertical div").scrollIntoView().then ($div) ->
        expect($div).to.match div

    it "scrolls x axis of window to element", ->
      expect(@win.scrollY).to.eq(0)
      expect(@win.scrollX).to.eq(0)

      cy.get("#scroll-into-view-win-horizontal div").scrollIntoView()
      cy.window().then (win) ->
        expect(win.scrollY).to.eq(0)
        expect(win.scrollX).not.to.eq(0)

    it "scrolls y axis of window to element", ->
      expect(@win.scrollY).to.eq(0)
      expect(@win.scrollX).to.eq(0)

      cy.get("#scroll-into-view-win-vertical div").scrollIntoView()
      cy.window().then (win) ->
        expect(win.pageYOffset).not.to.eq(0)
        expect(Math.floor(win.pageXOffset)).closeTo(200, 2)

    it "scrolls both axes of window to element", ->
      expect(@win.scrollY).to.eq(0)
      expect(@win.scrollX).to.eq(0)

      cy.get("#scroll-into-view-win-both div").scrollIntoView()
      cy.window().then (win) ->
        expect(win.scrollY).not.to.eq(0)
        expect(win.scrollX).not.to.eq(0)

    it "scrolls x axis of container to element", ->
      expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
      expect(@scrollHoriz.get(0).scrollLeft).to.eq(0)

      cy.get("#scroll-into-view-horizontal h5").scrollIntoView().then ($el) ->
        expect(@scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(@scrollHoriz.get(0).scrollLeft).to.eq(300)

    it "scrolls y axis of container to element", ->
      expect(@scrollVert.get(0).scrollTop).to.eq(0)
      expect(@scrollVert.get(0).scrollLeft).to.eq(0)

      cy.get("#scroll-into-view-vertical h5").scrollIntoView().then ($el) ->
        expect(@scrollVert.get(0).scrollTop).to.eq(300)
        expect(@scrollVert.get(0).scrollLeft).to.eq(0)

    it "scrolls both axes of container to element", ->
      expect(@scrollBoth.get(0).scrollTop).to.eq(0)
      expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

      cy.get("#scroll-into-view-both h5").scrollIntoView().then ($el) ->
        expect(@scrollBoth.get(0).scrollTop).to.eq(300)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(300)

    it "calls jQuery scroll to", ->
      scrollTo = cy.spy($.fn, "scrollTo")

      cy.get("#scroll-into-view-both h5").scrollIntoView().then ->
        expect(scrollTo).to.be.called

    it "sets duration to 0 by default", ->
      scrollTo = cy.spy($.fn, "scrollTo")

      cy.get("#scroll-into-view-both h5").scrollIntoView().then ->
        expect(scrollTo).to.be.calledWithMatch({}, {duration: 0})

    it "sets axis to correct x or y", ->
      scrollTo = cy.spy($.fn, "scrollTo")

      cy.get("#scroll-into-view-both h5").scrollIntoView().then ->
        expect(scrollTo).to.be.calledWithMatch({}, {axis: "xy"})

    it "scrolling resolves after a set duration", ->
      expect(@scrollBoth.get(0).scrollTop).to.eq(0)
      expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

      scrollTo = cy.spy($.fn, "scrollTo")

      cy.get("#scroll-into-view-both h5").scrollIntoView({duration: 500}).then ->
        expect(scrollTo).to.be.calledWithMatch({}, {duration: 500})
        expect(@scrollBoth.get(0).scrollLeft).to.eq(300)
        expect(@scrollBoth.get(0).scrollTop).to.eq(300)

    it "accepts duration string option", ->
      scrollTo = cy.spy($.fn, "scrollTo")

      cy.get("#scroll-into-view-both h5").scrollIntoView({duration: "500"}).then ->
        expect(scrollTo.args[0][1].duration).to.eq "500"

    it "accepts offset string option", ->
      scrollTo = cy.spy($.fn, "scrollTo")

      cy.get("#scroll-into-view-both h5").scrollIntoView({offset: 500}).then ->
        expect(scrollTo.args[0][1].offset).to.eq 500

    it "accepts offset object option", ->
      scrollTo = cy.spy($.fn, "scrollTo")

      cy.get("#scroll-into-view-both h5").scrollIntoView({offset: {left: 500, top: 200}}).then ->
        expect(scrollTo.args[0][1].offset).to.deep.eq {left: 500, top: 200}

    it "has easing set to swing by default", ->
      scrollTo = cy.spy($.fn, "scrollTo")

      cy.get("#scroll-into-view-both h5").scrollIntoView().then ->
        expect(scrollTo.args[0][1].easing).to.eq "swing"

    it "scrolling resolves after easing", ->
      expect(@scrollBoth.get(0).scrollTop).to.eq(0)
      expect(@scrollBoth.get(0).scrollLeft).to.eq(0)

      scrollTo = cy.spy($.fn, "scrollTo")

      cy.get("#scroll-into-view-both h5").scrollIntoView({easing: "linear"}).then ->
        expect(scrollTo).to.be.calledWithMatch({}, {easing: "linear"})
        expect(@scrollBoth.get(0).scrollTop).to.eq(300)
        expect(@scrollBoth.get(0).scrollLeft).to.eq(300)

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.on "command:retry", _.after 2, ->
          cy.$$("#scroll-into-view-win-vertical div").addClass("scrolled")

        cy
          .contains("scroll into view vertical")
          .scrollIntoView()
          .should("have.class", "scrolled").then ->
            lastLog = @lastLog

            expect(lastLog.get("name")).to.eq("assert")
            expect(lastLog.get("state")).to.eq("passed")
            expect(lastLog.get("ended")).to.be.true

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      context "subject errors", ->
        it "throws when not passed DOM element as subject", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollIntoView()` failed because it requires a DOM element."
            expect(err.message).to.include "{foo: bar}"
            expect(err.message).to.include "> `cy.noop()`"
            done()

          cy.noop({foo: "bar"}).scrollIntoView()

        it "throws when passed window object as subject", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollIntoView()` failed because it requires a DOM element."
            expect(err.message).to.include "<window>"
            expect(err.message).to.include "> `cy.window()`"
            done()

          cy.window().scrollIntoView()

        it "throws when passed document object as subject", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollIntoView()` failed because it requires a DOM element."
            expect(err.message).to.include "<document>"
            expect(err.message).to.include "> `cy.document()`"
            done()

          cy.document().scrollIntoView()

        it "throws if scrollable container is multiple elements", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollIntoView()` can only be used to scroll to 1 element, you tried to scroll to 2 elements."
            expect(err.docsUrl).to.include("https://on.cypress.io/scrollintoview")
            done()

          cy.get("button").scrollIntoView()

      context "argument errors", ->
        it "throws if arg passed as non-object", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollIntoView()` can only be called with an `options` object. Your argument was: `foo`"
            expect(err.docsUrl).to.eq("https://on.cypress.io/scrollintoview")
            done()

          cy.get("#scroll-into-view-both h5").scrollIntoView("foo")

      context "option errors", ->
        it "throws if duration is not a number or valid string", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollIntoView()` must be called with a valid `duration`. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: `foo`"
            expect(err.docsUrl).to.include("https://on.cypress.io/scrollintoview")
            done()

          cy.get("#scroll-into-view-both h5").scrollIntoView({ duration: "foo" })

        it "throws if unrecognized easing", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include "`cy.scrollIntoView()` must be called with a valid `easing`. Your easing was: `flower`"
            expect(err.docsUrl).to.include("https://on.cypress.io/scrollintoview")
            done()

          cy.get("#scroll-into-view-both h5").scrollIntoView({ easing: "flower" })

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "logs out scrollIntoView", ->
        cy.get("#scroll-into-view-both h5").scrollIntoView().then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq "scrollIntoView"

      it "passes in $el", ->
        cy.get("#scroll-into-view-both h5").scrollIntoView().then ($container) ->
          lastLog = @lastLog

          expect(lastLog.get("$el").get(0)).to.eq $container.get(0)

      it "logs duration options", ->
        cy.get("#scroll-into-view-both h5").scrollIntoView({duration: "1"}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "{duration: 1}"

      it "logs easing options", ->
        cy.get("#scroll-into-view-both h5").scrollIntoView({easing: "linear"}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "{easing: linear}"

      it "logs offset options", ->
        cy.get("#scroll-into-view-both h5").scrollIntoView({offset: {left: 500, top: 200}}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "{offset: {left: 500, top: 200}}"

      it "snapshots immediately", ->
        cy.get("#scroll-into-view-both h5").scrollIntoView().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "#consoleProps", ->
        cy.get("#scroll-into-view-both h5").scrollIntoView().then ($container) ->
          console = @lastLog.invoke("consoleProps")
          expect(console.Command).to.eq("scrollIntoView")
          expect(console["Applied To"]).to.eq $container.get(0)
          expect(console["Scrolled Element"]).to.exist

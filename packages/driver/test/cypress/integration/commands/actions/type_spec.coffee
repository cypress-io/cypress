$ = Cypress.$.bind(Cypress)
_ = Cypress._
Keyboard = Cypress.Keyboard
Promise = Cypress.Promise
$selection = require("../../../../../src/dom/selection")

describe "src/cy/commands/actions/type", ->
  before ->
    cy
      .visit("/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#type", ->
    it "does not change the subject", ->
      input = cy.$$("input:first")

      cy.get("input:first").type("foo").then ($input) ->
        expect($input).to.match input

    it "changes the value", ->
      input = cy.$$("input:text:first")

      input.val("")

      ## make sure we are starting from a
      ## clean state
      expect(input).to.have.value("")

      cy.get("input:text:first").type("foo").then ($input) ->
        expect($input).to.have.value("foo")

    it "appends subsequent type commands", ->
      cy
        .get("input:first").type("123").type("456")
        .should("have.value", "123456")

    it "appends subsequent commands when value is changed in between", ->
      cy
        .get("input:first")
        .type("123")
        .then ($input) ->
          $input[0].value += '-'
          return $input
        .type("456")
        .should("have.value", "123-456")

    it "can type numbers", ->
      cy.get(":text:first").type(123).then ($text) ->
        expect($text).to.have.value("123")

    it "triggers focus event on the input", (done) ->
      cy.$$("input:text:first").focus -> done()

      cy.get("input:text:first").type("bar")

    it "lists the input as the focused element", ->
      $input = cy.$$("input:text:first")

      cy.get("input:text:first").type("bar").focused().then ($focused) ->
        expect($focused.get(0)).to.eq $input.get(0)

    it "causes previous input to receive blur", ->
      blurred = false

      cy.$$("input:text:first").blur ->
        blurred = true

      cy
        .get("input:text:first").type("foo")
        .get("input:text:last").type("bar")
        .then ->
          expect(blurred).to.be.true

    it "can type into contenteditable", ->
      oldText = cy.$$("#contenteditable").get(0).innerText

      cy.get("#contenteditable")
      .type(" foo")
      .then ($div) ->
        expect($div.get(0).innerText).to.eq (oldText + " foo")

    it "delays 50ms before resolving", ->
      cy.$$(":text:first").on "change", (e) =>
        cy.spy(Promise, "delay")

      cy.get(":text:first").type("foo{enter}").then ->
        expect(Promise.delay).to.be.calledWith(50, "type")

    it "increases the timeout delta", ->
      cy.spy(cy, "timeout")

      cy.get(":text:first").type("foo{enter}").then ->
        expect(cy.timeout).to.be.calledWith(40, true, "type")
        expect(cy.timeout).to.be.calledWith(50, true, "type")

    it "accepts body as subject", ->
      cy.get("body").type("foo")

    it "does not click when body is subject", ->
      bodyClicked = false
      cy.$$("body").on "click", -> bodyClicked = true

      cy.get("body").type("foo").then ->
        expect(bodyClicked).to.be.false

    describe "actionability", ->
      it "can forcibly click even when element is invisible", ->
        $txt = cy.$$(":text:first").hide()

        expect($txt).not.to.have.value("foo")

        clicked = false

        $txt.on "click", ->
          clicked = true

        cy.get(":text:first").type("foo", {force: true}).then ($input) ->
          expect(clicked).to.be.true
          expect($input).to.have.value("foo")

      it "can forcibly click even when being covered by another element", ->
        $input = $("<input />")
        .attr("id", "input-covered-in-span")
        .css({
          width: 50
        })
        .prependTo(cy.$$("body"))

        $span = $("<span>span on input</span>")
        .css({
          position: "absolute",
          left: $input.offset().left,
          top: $input.offset().top,
          padding: 5,
          display: "inline-block",
          backgroundColor: "yellow"
        })
        .prependTo(cy.$$("body"))

        clicked = false

        $input.on "click", ->
          clicked = true

        cy.get("#input-covered-in-span").type("foo", {force: true}).then ($input) ->
          expect(clicked).to.be.true
          expect($input).to.have.value("foo")

      it "waits until element becomes visible", ->
        $txt = cy.$$(":text:first").hide()

        retried = false

        cy.on "command:retry", _.after 3, ->
          $txt.show()
          retried = true

        cy.get(":text:first").type("foo").then ->
          expect(retried).to.be.true

      it "waits until element is no longer disabled", ->
        $txt = cy.$$(":text:first").prop("disabled", true)

        retried = false
        clicks = 0

        $txt.on "click", ->
          clicks += 1

        cy.on "command:retry", _.after 3, ->
          $txt.prop("disabled", false)
          retried = true

        cy.get(":text:first").type("foo").then ->
          expect(clicks).to.eq(1)
          expect(retried).to.be.true

      it "waits until element stops animating", ->
        retries = 0

        cy.on "command:retry", (obj) ->
          retries += 1

        cy.stub(cy, "ensureElementIsNotAnimating")
        .throws(new Error("animating!"))
        .onThirdCall().returns()

        cy.get(":text:first").type("foo").then ->
          ## - retry animation coords
          ## - retry animation
          ## - retry animation
          expect(retries).to.eq(3)
          expect(cy.ensureElementIsNotAnimating).to.be.calledThrice

      it "does not throw when waiting for animations is disabled", ->
        cy.stub(cy, "ensureElementIsNotAnimating").throws(new Error("animating!"))
        Cypress.config("waitForAnimations", false)

        cy.get(":text:first").type("foo").then ->
          expect(cy.ensureElementIsNotAnimating).not.to.be.called

      it "does not throw when turning off waitForAnimations in options", ->
        cy.stub(cy, "ensureElementIsNotAnimating").throws(new Error("animating!"))

        cy.get(":text:first").type("foo", {waitForAnimations: false}).then ->
          expect(cy.ensureElementIsNotAnimating).not.to.be.called

      it "passes options.animationDistanceThreshold to cy.ensureElementIsNotAnimating", ->
        $txt = cy.$$(":text:first")

        { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($txt)

        cy.spy(cy, "ensureElementIsNotAnimating")

        cy.get(":text:first").type("foo", {animationDistanceThreshold: 1000}).then ->
          args = cy.ensureElementIsNotAnimating.firstCall.args

          expect(args[1]).to.deep.eq([fromWindow, fromWindow])
          expect(args[2]).to.eq(1000)

      it "passes config.animationDistanceThreshold to cy.ensureElementIsNotAnimating", ->
        animationDistanceThreshold = Cypress.config("animationDistanceThreshold")

        $txt = cy.$$(":text:first")

        { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($txt)

        cy.spy(cy, "ensureElementIsNotAnimating")

        cy.get(":text:first").type("foo").then ->
          args = cy.ensureElementIsNotAnimating.firstCall.args

          expect(args[1]).to.deep.eq([fromWindow, fromWindow])
          expect(args[2]).to.eq(animationDistanceThreshold)

    describe "input types where no extra formatting required", ->
      _.each [
        "password"
        "email"
        "number"
        "search"
        "url"
        "tel"
        ], (type) ->
          it "accepts input [type=#{type}]", ->
            input = cy.$$("<input type='#{type}' id='input-type-#{type}' />")

            cy.$$("body").append(input)

            cy.get("#input-type-#{type}").type("1234").then ($input) ->
              expect($input).to.have.value "1234"
              expect($input.get(0)).to.eq $input.get(0)

          it "accepts type [type=#{type}], regardless of capitalization", ->
            input = cy.$$("<input type='#{type.toUpperCase()}' id='input-type-#{type}' />")

            cy.$$("body").append(input)

            cy.get("#input-type-#{type}").type("1234")

    describe "tabindex", ->
      beforeEach ->
        @$div = cy.$$("#tabindex")

      it "receives keydown, keyup, keypress", ->
        keydown  = false
        keypress = false
        keyup    = false

        @$div.keydown ->
          keydown = true

        @$div.keypress ->
          keypress = true

        @$div.keyup ->
          keyup = true

        cy.get("#tabindex").type("a").then ->
          expect(keydown).to.be.true
          expect(keypress).to.be.true
          expect(keyup).to.be.true

      it "does not receive textInput", ->
        textInput = false

        @$div.on "textInput", ->
          textInput = true

        cy.get("#tabindex").type("f").then ->
          expect(textInput).to.be.false

      it "does not receive input", ->
        input = false

        @$div.on "input", ->
          input = true

        cy.get("#tabindex").type("f").then ->
          expect(input).to.be.false

      it "does not receive change event", ->
        innerText = @$div.text()

        change = false

        @$div.on "change", ->
          change = true

        cy.get("#tabindex").type("foo{enter}").then ($el) ->
          expect(change).to.be.false
          expect($el.text()).to.eq(innerText)

      it "does not change inner text", ->
        innerText = @$div.text()

        cy.get("#tabindex").type("foo{leftarrow}{del}{rightarrow}{enter}").should("have.text", innerText)

      it "receives focus", ->
        focus = false

        @$div.focus ->
          focus = true

        cy.get("#tabindex").type("f").then ->
          expect(focus).to.be.true

      it "receives blur", ->
        blur = false

        @$div.blur ->
          blur = true

        cy
          .get("#tabindex").type("f")
          .get("input:first").focus().then ->
            expect(blur).to.be.true

      it "receives keydown and keyup for other special characters and keypress for enter and regular characters", ->
        keydowns = []
        keyups = []
        keypresses = []

        @$div.keydown (e) ->
          keydowns.push(e)

        @$div.keypress (e) ->
          keypresses.push(e)

        @$div.keyup (e) ->
          keyups.push(e)

        cy
          .get("#tabindex").type("f{leftarrow}{rightarrow}{enter}")
          .then ->
            expect(keydowns).to.have.length(4)
            expect(keypresses).to.have.length(2)
            expect(keyups).to.have.length(4)

    describe "delay", ->
      it "adds delay to delta for each key sequence", ->
        cy.spy(cy, "timeout")

        cy
          .get(":text:first")
          .type("foo{enter}bar{leftarrow}", { delay: 5 })
          .then ->
            expect(cy.timeout).to.be.calledWith(5 * 8, true, "type")

      it "can cancel additional keystrokes", (done) ->
        cy.stub(Cypress.runner, "stop")

        text = cy.$$(":text:first").keydown _.after 3, ->
          Cypress.stop()

        cy.on "stop", ->
          _.delay ->
            expect(text).to.have.value("foo")
            done()
          , 50

        cy.get(":text:first").type("foo{enter}bar{leftarrow}")

    describe "events", ->
      it "receives keydown event", (done) ->
        $txt = cy.$$(":text:first")

        $txt.on "keydown", (e) =>
          obj = _.pick(e.originalEvent, "altKey", "bubbles", "cancelable", "charCode", "ctrlKey", "detail", "keyCode", "view", "layerX", "layerY", "location", "metaKey", "pageX", "pageY", "repeat", "shiftKey", "type", "which", "key")
          expect(obj).to.deep.eq {
            altKey: false
            bubbles: true
            cancelable: true
            charCode: 0 ## deprecated
            ctrlKey: false
            detail: 0
            key: "a"
            keyCode: 65 ## deprecated but fired by chrome always uppercase in the ASCII table
            layerX: 0
            layerY: 0
            location: 0
            metaKey: false
            pageX: 0
            pageY: 0
            repeat: false
            shiftKey: false
            type: "keydown"
            view: cy.state("window")
            which: 65 ## deprecated but fired by chrome
          }
          done()

        cy.get(":text:first").type("a")

      it "receives keypress event", (done) ->
        $txt = cy.$$(":text:first")

        $txt.on "keypress", (e) =>
          obj = _.pick(e.originalEvent, "altKey", "bubbles", "cancelable", "charCode", "ctrlKey", "detail", "keyCode", "view", "layerX", "layerY", "location", "metaKey", "pageX", "pageY", "repeat", "shiftKey", "type", "which", "key")
          expect(obj).to.deep.eq {
            altKey: false
            bubbles: true
            cancelable: true
            charCode: 97 ## deprecated
            ctrlKey: false
            detail: 0
            key: "a"
            keyCode: 97 ## deprecated
            layerX: 0
            layerY: 0
            location: 0
            metaKey: false
            pageX: 0
            pageY: 0
            repeat: false
            shiftKey: false
            type: "keypress"
            view: cy.state("window")
            which: 97 ## deprecated
          }
          done()

        cy.get(":text:first").type("a")

      it "receives keyup event", (done) ->
        $txt = cy.$$(":text:first")

        $txt.on "keyup", (e) =>
          obj = _.pick(e.originalEvent, "altKey", "bubbles", "cancelable", "charCode", "ctrlKey", "detail", "keyCode", "view", "layerX", "layerY", "location", "metaKey", "pageX", "pageY", "repeat", "shiftKey", "type", "which", "key")
          expect(obj).to.deep.eq {
            altKey: false
            bubbles: true
            cancelable: true
            charCode: 0 ## deprecated
            ctrlKey: false
            detail: 0
            key: "a"
            keyCode: 65 ## deprecated but fired by chrome always uppercase in the ASCII table
            layerX: 0
            layerY: 0
            location: 0
            metaKey: false
            pageX: 0
            pageY: 0
            repeat: false
            shiftKey: false
            type: "keyup"
            view: cy.state("window")
            which: 65 ## deprecated but fired by chrome
          }
          done()

        cy.get(":text:first").type("a")

      it "receives textInput event", (done) ->
        $txt = cy.$$(":text:first")

        $txt.on "textInput", (e) =>
          obj = _.pick e.originalEvent, "bubbles", "cancelable", "charCode", "data", "detail", "keyCode", "layerX", "layerY", "pageX", "pageY", "type", "view", "which"
          expect(obj).to.deep.eq {
            bubbles: true
            cancelable: true
            charCode: 0
            data: "a"
            detail: 0
            keyCode: 0
            layerX: 0
            layerY: 0
            pageX: 0
            pageY: 0
            type: "textInput"
            view: cy.state("window")
            which: 0
          }
          done()

        cy.get(":text:first").type("a")

      it "receives input event", (done) ->
        $txt = cy.$$(":text:first")

        $txt.on "input", (e) =>
          obj = _.pick e.originalEvent, "bubbles", "cancelable", "type"
          expect(obj).to.deep.eq {
            bubbles: true
            cancelable: false
            type: "input"
          }
          done()

        cy.get(":text:first").type("a")

      it "fires events in the correct order"

      it "fires events for each key stroke"

      it "does fire input event when value changes", ->
        fired = false
        cy.$$(":text:first").on "input", ->
          fired = true

        fired = false
        cy.get(":text:first")
          .invoke("val", "bar")
          .type("{selectAll}{rightarrow}{backspace}")
          .then ->
            expect(fired).to.eq true

        fired = false
        cy.get(":text:first")
          .invoke("val", "bar")
          .type("{selectAll}{leftarrow}{del}")
          .then ->
            expect(fired).to.eq true

        cy.$$('[contenteditable]:first').on "input", () ->
          fired = true

        fired = false
        cy.get('[contenteditable]:first')
          .invoke('html', 'foobar')
          .type('{selectAll}{rightarrow}{backspace}')
          .then ->
            expect(fired).to.eq true

        fired = false
        cy.get('[contenteditable]:first')
          .invoke('html', 'foobar')
          .type('{selectAll}{leftarrow}{del}')
          .then ->
            expect(fired).to.eq true

      it "does not fire input event when value does not change", ->
        fired = false
        cy.$$(":text:first").on "input", (e) ->
          fired = true

        fired = false
        cy.get(":text:first")
          .invoke("val", "bar")
          .type('{selectAll}{rightarrow}{del}')
          .then ->
            expect(fired).to.eq false

        fired = false
        cy.get(":text:first")
          .invoke("val", "bar")
          .type('{selectAll}{leftarrow}{backspace}')
          .then ->
            expect(fired).to.eq false

        cy.$$("textarea:first").on "input", (e) ->
          fired = true

        fired = false
        cy.get("textarea:first")
          .invoke("val", "bar")
          .type('{selectAll}{rightarrow}{del}')
          .then ->
            expect(fired).to.eq false

        fired = false
        cy.get("textarea:first")
          .invoke("val", "bar")
          .type('{selectAll}{leftarrow}{backspace}')
          .then ->
            expect(fired).to.eq false

        cy.$$('[contenteditable]:first').on "input", () ->
          fired = true

        fired = false
        cy.get('[contenteditable]:first')
          .invoke('html', 'foobar')
          .type('{selectAll}{rightarrow}{del}')
          .then ->
            expect(fired).to.eq false

        fired = false
        cy.get('[contenteditable]:first')
          .invoke('html', 'foobar')
          .type('{selectAll}{leftarrow}{backspace}')
          .then ->
            expect(fired).to.eq false

    describe "maxlength", ->
      it "limits text entered to the maxlength attribute of a text input", ->
        $input = cy.$$(":text:first")
        $input.attr("maxlength", 5)

        cy.get(":text:first")
          .type("1234567890")
          .then (input) ->
            expect(input).to.have.value("12345")

      it "ignores an invalid maxlength attribute", ->
        $input = cy.$$(":text:first")
        $input.attr("maxlength", "five")

        cy.get(":text:first")
          .type("1234567890")
          .then (input) ->
            expect(input).to.have.value("1234567890")

      it "handles special characters", ->
        $input = cy.$$(":text:first")
        $input.attr("maxlength", 5)

        cy.get(":text:first")
          .type("12{selectall}")
          .then (input) ->
            expect(input).to.have.value("12")

      it "maxlength=0 events", ->
        events = []

        push = (evt) ->
          return ->
            events.push(evt)

        cy
        .$$(":text:first")
        .attr("maxlength", 0)
        .on("keydown", push("keydown"))
        .on("keypress", push("keypress"))
        .on("textInput", push("textInput"))
        .on("input", push("input"))
        .on("keyup", push("keyup"))

        cy.get(":text:first")
          .type("1")
          .then ->
            expect(events).to.deep.eq([
              "keydown", "keypress", "textInput", "keyup"
            ])

      it "maxlength=1 events", ->
        events = []

        push = (evt) ->
          return ->
            events.push(evt)

        cy
        .$$(":text:first")
        .attr("maxlength", 1)
        .on("keydown", push("keydown"))
        .on("keypress", push("keypress"))
        .on("textInput", push("textInput"))
        .on("input", push("input"))
        .on("keyup", push("keyup"))

        cy.get(":text:first")
          .type("12")
          .then ->
            expect(events).to.deep.eq([
              "keydown", "keypress", "textInput", "input", "keyup"
              "keydown", "keypress", "textInput", "keyup"
            ])

    describe "value changing", ->
      it "changes the elements value", ->
        cy.get("#input-without-value").type("a").then ($text) ->
          expect($text).to.have.value("a")

      it "changes the elements value for multiple keys", ->
        cy.get("#input-without-value").type("foo").then ($text) ->
          expect($text).to.have.value("foo")

      it "inserts text after existing text", ->
        cy.get("#input-with-value").type(" bar").then ($text) ->
          expect($text).to.have.value("foo bar")

      it "inserts text after existing text input by invoking val", ->
        cy.get("#input-without-value").invoke("val", "foo").type(" bar").then ($text) ->
          expect($text).to.have.value("foo bar")

      it "overwrites text when currently has selection", ->
        cy.get("#input-without-value").invoke('val', '0').then (el) ->
          el.select()

        cy.get("#input-without-value").type("50").then ($input) ->
          expect($input).to.have.value("50")

      it "overwrites text when selectAll in click handler", ->
        cy.$$("#input-without-value").val("0").click ->
          $(@).select()

      it "overwrites text when selectAll in mouseup handler", ->
        cy.$$("#input-without-value").val("0").mouseup ->
          $(@).select()

      it "overwrites text when selectAll in mouseup handler", ->
        cy.$$("#input-without-value").val("0").mouseup ->
          $(@).select()

      it "responsive to keydown handler", ->
        cy.$$("#input-without-value").val("1234").keydown ->
          $(@).get(0).setSelectionRange(0,0)
        cy.get("#input-without-value").type("56").then ($input) ->
          expect($input).to.have.value("651234")

      it "responsive to keyup handler", ->
        cy.$$("#input-without-value").val("1234").keyup ->
          $(@).get(0).setSelectionRange(0,0)
        cy.get("#input-without-value").type("56").then ($input) ->
          expect($input).to.have.value("612345")

      it "responsive to input handler", ->
        cy.$$("#input-without-value").val("1234").keyup ->
          $(@).get(0).setSelectionRange(0,0)
        cy.get("#input-without-value").type("56").then ($input) ->
          expect($input).to.have.value("612345")

      it "responsive to change handler", ->
        cy.$$("#input-without-value").val("1234").change ->
          $(@).get(0).setSelectionRange(0,0)
        ## no change event should be fired
        cy.get("#input-without-value").type("56").then ($input) ->
          expect($input).to.have.value("123456")

      it "automatically moves the caret to the end if value is changed manually", ->
        cy.$$("#input-without-value").keypress (e) ->
          e.preventDefault()

          key = String.fromCharCode(e.which)

          $input = $(e.target)

          val = $input.val()

          ## setting value updates cursor to the end of input
          $input.val(val + key + "-")

        cy.get("#input-without-value").type("foo").then ($input) ->
          expect($input).to.have.value("f-o-o-")

      it "automatically moves the caret to the end if value is changed manually asynchronously", ->
        cy.$$("#input-without-value").keypress (e) ->
          key = String.fromCharCode(e.which)

          $input = $(e.target)

          _.defer ->
            val = $input.val()
            $input.val(val + "-")

        cy.get("#input-without-value").type("foo").then ($input) ->
          expect($input).to.have.value("f-o-o-")

      it "does not fire keypress when keydown is preventedDefault", (done) ->
        cy.$$("#input-without-value").get(0).addEventListener "keypress", (e) ->
          done("should not have received keypress event")

        cy.$$("#input-without-value").get(0).addEventListener "keydown", (e) ->
          e.preventDefault()

        cy.get("#input-without-value").type("foo").then -> done()

      it "does not insert key when keydown is preventedDefault", ->
        cy.$$("#input-without-value").get(0).addEventListener "keydown", (e) ->
          e.preventDefault()

        cy.get("#input-without-value").type("foo").then ($text) ->
          expect($text).to.have.value("")

      it "does not insert key when keypress is preventedDefault", ->
        cy.$$("#input-without-value").get(0).addEventListener "keypress", (e) ->
          e.preventDefault()

        cy.get("#input-without-value").type("foo").then ($text) ->
          expect($text).to.have.value("")

      it "does not fire textInput when keypress is preventedDefault", (done) ->
        cy.$$("#input-without-value").get(0).addEventListener "textInput", (e) ->
          done("should not have received textInput event")

        cy.$$("#input-without-value").get(0).addEventListener "keypress", (e) ->
          e.preventDefault()

        cy.get("#input-without-value").type("foo").then -> done()

      it "does not insert key when textInput is preventedDefault", ->
        cy.$$("#input-without-value").get(0).addEventListener "textInput", (e) ->
          e.preventDefault()

        cy.get("#input-without-value").type("foo").then ($text) ->
          expect($text).to.have.value("")

      it "does not fire input when textInput is preventedDefault", (done) ->
        cy.$$("#input-without-value").get(0).addEventListener "input", (e) ->
          done("should not have received input event")

        cy.$$("#input-without-value").get(0).addEventListener "textInput", (e) ->
          e.preventDefault()

        cy.get("#input-without-value").type("foo").then -> done()

      it "preventing default to input event should not affect anything", ->
        cy.$$("#input-without-value").get(0).addEventListener "input", (e) ->
          e.preventDefault()

        cy.get("#input-without-value").type("foo").then ($input) ->
          expect($input).to.have.value("foo")

      describe "input[type=number]", ->
        it "can change values", ->
          cy.get("#number-without-value").type("42").then ($text) ->
            expect($text).to.have.value("42")

        it "can input decimal", ->
          cy.get("#number-without-value").type("2.0").then ($input) ->
            expect($input).to.have.value("2.0")

        it "can utilize {selectall}", ->
          cy.get("#number-with-value").type("{selectall}99").then ($input) ->
            expect($input).to.have.value("99")

        it "can utilize arrows", ->
          cy.get("#number-with-value").type("{leftarrow}{leftarrow}{rightarrow}9").then ($input) ->
            expect($input).to.have.value("192")

        it "inserts text after existing text ", ->
          cy.get("#number-with-value").type("34").then ($text) ->
            expect($text).to.have.value("1234")

        it "inserts text after existing text input by invoking val", ->
          cy.get("#number-without-value").invoke("val", "12").type("34").then ($text) ->
            expect($text).to.have.value("1234")

        it "overwrites text on input[type=number] when input has existing text selected", ->
          cy.get("#number-without-value").invoke('val', "0").then (el) ->
            el.get(0).select()

          cy.get("#number-without-value").type("50").then ($input) ->
            expect($input).to.have.value("50")

        it "can type negative numbers", ->
          cy.get('#number-without-value')
            .type('-123.12')
            .should('have.value', '-123.12')

        it "type=number blurs consistently", ->
          blurred = 0
          cy.$$("#number-without-value").blur ->
            blurred++
          cy.get("#number-without-value")
          .type('200').blur()
          .then ->
            expect(blurred).to.eq 1

      describe "input[type=email]", ->
        it "can change values", ->
          cy.get("#email-without-value").type("brian@foo.com").then ($text) ->
            expect($text).to.have.value("brian@foo.com")

        it "can utilize {selectall}", ->
          cy.get("#email-with-value").type("{selectall}brian@foo.com").then ($text) ->
            expect($text).to.have.value("brian@foo.com")

        it "can utilize arrows", ->
          cy.get("#email-with-value").type("{leftarrow}{rightarrow}om").then ($text) ->
            expect($text).to.have.value("brian@foo.com")

        it "inserts text after existing text", ->
          cy.get("#email-with-value").type("om").then ($text) ->
            expect($text).to.have.value("brian@foo.com")

        it "inserts text after existing text input by invoking val", ->
          cy.get("#email-without-value").invoke("val", "brian@foo.c").type("om").then ($text) ->
            expect($text).to.have.value("brian@foo.com")

        it "overwrites text when input has existing text selected", ->
          cy.get("#email-without-value").invoke('val', "foo@bar.com").invoke('select')

          cy.get("#email-without-value").type("bar@foo.com").then ($input) ->
            expect($input).to.have.value("bar@foo.com")

        it "type=email blurs consistently", ->
          blurred = 0
          cy.$$("#email-without-value").blur ->
            blurred++
          cy.get("#email-without-value")
          .type('foo@bar.com').blur()
          .then ->
            expect(blurred).to.eq 1

      describe "input[type=password]", ->
        it "can change values", ->
          cy.get("#password-without-value").type("password").then ($text) ->
            expect($text).to.have.value("password")

        it "inserts text after existing text", ->
          cy.get("#password-with-value").type("word").then ($text) ->
            expect($text).to.have.value("password")

        it "inserts text after existing text input by invoking val", ->
          cy.get("#password-without-value").invoke("val", "secr").type("et").then ($text) ->
            expect($text).to.have.value("secret")

        it "overwrites text when input has existing text selected", ->
          cy.get("#password-without-value").invoke('val', "secret").invoke('select')

          cy.get("#password-without-value").type("agent").then ($input) ->
            expect($input).to.have.value("agent")

        it "overwrites text when input has selected range of text in click handler", ->
          cy.$$("#input-with-value").mouseup (e) ->
            # e.preventDefault()

            e.target.setSelectionRange(1, 1)

          select = (e) ->
            e.target.select()

          cy
          .$$("#password-without-value")
          .val("secret")
          .click(select)
          .keyup (e) ->
            switch e.key
              when "g"
                select(e)
              when "n"
                e.target.setSelectionRange(0, 1)

          cy.get("#password-without-value").type("agent").then ($input) ->
            expect($input).to.have.value("tn")

      describe "input[type=date]", ->
        it "can change values", ->
          cy.get("#date-without-value").type("1959-09-13").then ($text) ->
            expect($text).to.have.value("1959-09-13")

        it "overwrites existing value", ->
          cy.get("#date-with-value").type("1959-09-13").then ($text) ->
            expect($text).to.have.value("1959-09-13")

        it "overwrites existing value input by invoking val", ->
          cy.get("#date-without-value").invoke("val", "2016-01-01").type("1959-09-13").then ($text) ->
            expect($text).to.have.value("1959-09-13")

      describe "input[type=month]", ->
        it "can change values", ->
          cy.get("#month-without-value").type("1959-09").then ($text) ->
            expect($text).to.have.value("1959-09")

        it "overwrites existing value", ->
          cy.get("#month-with-value").type("1959-09").then ($text) ->
            expect($text).to.have.value("1959-09")

        it "overwrites existing value input by invoking val", ->
          cy.get("#month-without-value").invoke("val", "2016-01").type("1959-09").then ($text) ->
            expect($text).to.have.value("1959-09")

      describe "input[type=week]", ->
        it "can change values", ->
          cy.get("#week-without-value").type("1959-W09").then ($text) ->
            expect($text).to.have.value("1959-W09")

        it "overwrites existing value", ->
          cy.get("#week-with-value").type("1959-W09").then ($text) ->
            expect($text).to.have.value("1959-W09")

        it "overwrites existing value input by invoking val", ->
          cy.get("#week-without-value").invoke("val", "2016-W01").type("1959-W09").then ($text) ->
            expect($text).to.have.value("1959-W09")

      describe "input[type=time]", ->
        it "can change values", ->
          cy.get("#time-without-value").type("01:23:45").then ($text) ->
            expect($text).to.have.value("01:23:45")

        it "overwrites existing value", ->
          cy.get("#time-with-value").type("12:34:56").then ($text) ->
            expect($text).to.have.value("12:34:56")

        it "overwrites existing value input by invoking val", ->
          cy.get("#time-without-value").invoke("val", "01:23:45").type("12:34:56").then ($text) ->
            expect($text).to.have.value("12:34:56")

        it "can be formatted HH:mm", ->
          cy.get("#time-without-value").type("01:23").then ($text) ->
            expect($text).to.have.value("01:23")

        it "can be formatted HH:mm:ss", ->
          cy.get("#time-without-value").type("01:23:45").then ($text) ->
            expect($text).to.have.value("01:23:45")

        it "can be formatted HH:mm:ss.S", ->
          cy.get("#time-without-value").type("01:23:45.9").then ($text) ->
            expect($text).to.have.value("01:23:45.9")

        it "can be formatted HH:mm:ss.SS", ->
          cy.get("#time-without-value").type("01:23:45.99").then ($text) ->
            expect($text).to.have.value("01:23:45.99")

        it "can be formatted HH:mm:ss.SSS", ->
          cy.get("#time-without-value").type("01:23:45.999").then ($text) ->
            expect($text).to.have.value("01:23:45.999")

      describe "[contenteditable]", ->
        it "can change values", ->
          cy.get("#input-types [contenteditable]").type("foo").then ($div) ->
            expect($div).to.have.text("foo")

        it "inserts text after existing text", ->
          cy.get("#input-types [contenteditable]").invoke("text", "foo").type(" bar").then ($text) ->
            expect($text).to.have.text("foo bar")

        it "can type into [contenteditable] with existing <div>", ->
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>foo</div>'
          cy.get("[contenteditable]:first")
          .type("bar").then ($div) ->
            expect($div.get(0).innerText).to.eql("foobar\n")
            expect($div.get(0).textContent).to.eql("foobar")
            expect($div.get(0).innerHTML).to.eql("<div>foobar</div>")

        it "can type into [contenteditable] with existing <p>", ->
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<p>foo</p>'
          cy.get("[contenteditable]:first")
          .type("bar").then ($div) ->
            expect($div.get(0).innerText).to.eql("foobar\n\n")
            expect($div.get(0).textContent).to.eql("foobar")
            expect($div.get(0).innerHTML).to.eql("<p>foobar</p>")

        it "collapses selection to start on {leftarrow}", ->
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>bar</div>'
          cy.get("[contenteditable]:first")
          .type("{selectall}{leftarrow}foo").then ($div) ->
            expect($div.get(0).innerText).to.eql("foobar\n")

        it "collapses selection to end on {rightarrow}", ->
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>bar</div>'
          cy.get("[contenteditable]:first")
          .type("{selectall}{leftarrow}foo{selectall}{rightarrow}baz").then ($div) ->
            expect($div.get(0).innerText).to.eql("foobarbaz\n")

        it "can remove a placeholder <br>", ->
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div><br></div>'
          cy.get("[contenteditable]:first")
          .type("foobar").then ($div) ->
            expect($div.get(0).innerHTML).to.eql("<div>foobar</div>")

        it "can type into an iframe with designmode = 'on'", ->
          ## append a new iframe to the body
          cy.$$('<iframe id="generic-iframe" src="/fixtures/generic.html" style="height: 500px"></iframe>')
            .appendTo cy.$$('body')

          ## wait for iframe to load
          loaded = false
          cy.get('#generic-iframe')
            .then ($iframe) ->
              $iframe.load ->
                loaded = true
            .scrollIntoView()
            .should ->
              expect(loaded).to.eq true

          ## type text into iframe
          cy.get('#generic-iframe')
            .then ($iframe) ->
              $iframe[0].contentDocument.designMode = 'on'
              iframe = $iframe.contents()
              cy.wrap(iframe.find('html')).first()
                .type('{selectall}{del} foo bar baz{enter}ac{leftarrow}b')

          # assert that text was typed
          cy.get('#generic-iframe')
            .then ($iframe) ->
              iframeText = $iframe[0].contentDocument.body.innerText
              expect(iframeText).to.include('foo bar baz\nabc')

      ## TODO: fix this with 4.0 updates
      describe.skip "element reference loss", ->
        it 'follows the focus of the cursor', ->
          charCount = 0
          cy.$$('input:first').keydown ->
            if charCount is 3
              cy.$$('input').eq(1).focus()
            charCount++
          cy.get('input:first').type('foobar').then ->
            cy.get('input:first').should('have.value', 'foo')
            cy.get('input').eq(1).should('have.value', 'bar')

    describe "specialChars", ->
      context "{{}", ->
        it "sets which and keyCode to 219", (done) ->
          cy.$$(":text:first").on "keydown", (e) ->
            expect(e.which).to.eq 219
            expect(e.keyCode).to.eq 219
            done()

          cy.get(":text:first").invoke("val", "ab").type("{{}")

        it "fires keypress event with 123 charCode", (done) ->
          cy.$$(":text:first").on "keypress", (e) ->
            expect(e.charCode).to.eq 123
            expect(e.which).to.eq 123
            expect(e.keyCode).to.eq 123
            done()

          cy.get(":text:first").invoke("val", "ab").type("{{}")

        it "fires textInput event with e.data", (done) ->
          cy.$$(":text:first").on "textInput", (e) ->
            expect(e.originalEvent.data).to.eq "{"
            done()

          cy.get(":text:first").invoke("val", "ab").type("{{}")

        it "fires input event", (done) ->
          cy.$$(":text:first").on "input", (e) ->
            done()

          cy.get(":text:first").invoke("val", "ab").type("{{}")

        it "can prevent default character insertion", ->
          cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 219
              e.preventDefault()

          cy.get(":text:first").invoke("val", "foo").type("{{}").then ($input) ->
            expect($input).to.have.value("foo")

      context "{esc}", ->
        it "sets which and keyCode to 27 and does not fire keypress events", (done) ->
          cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          cy.$$(":text:first").on "keydown", (e) ->
            expect(e.which).to.eq 27
            expect(e.keyCode).to.eq 27
            expect(e.key).to.eq "Escape"
            done()

          cy.get(":text:first").invoke("val", "ab").type("{esc}")

        it "does not fire textInput event", (done) ->
          cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{esc}").then -> done()

        it "does not fire input event", (done) ->
          cy.$$(":text:first").on "input", (e) ->
            done("input should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{esc}").then -> done()

        it "can prevent default esc movement", (done) ->
          cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 27
              e.preventDefault()

          cy.get(":text:first").invoke("val", "foo").type("d{esc}").then ($input) ->
            expect($input).to.have.value("food")
            done()

      context "{backspace}", ->
        it "backspaces character to the left", ->
          cy.get(":text:first").invoke("val", "bar").type("{leftarrow}{backspace}u").then ($input) ->
            expect($input).to.have.value("bur")

        it "can backspace a selection range of characters", ->
          cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'ar' characters
              $input.get(0).setSelectionRange(1,3)
            .get(":text:first").type("{backspace}").then ($input) ->
              expect($input).to.have.value("b")

        it "sets which and keyCode to 8 and does not fire keypress events", (done) ->
          cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          cy.$$(":text:first").on "keydown", _.after 2, (e) ->
            expect(e.which).to.eq 8
            expect(e.keyCode).to.eq 8
            expect(e.key).to.eq "Backspace"
            done()

          cy.get(":text:first").invoke("val", "ab").type("{leftarrow}{backspace}")

        it "does not fire textInput event", (done) ->
          cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{backspace}").then -> done()

        it "can prevent default backspace movement", (done) ->
          cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 8
              e.preventDefault()

          cy.get(":text:first").invoke("val", "foo").type("{leftarrow}{backspace}").then ($input) ->
            expect($input).to.have.value("foo")
            done()

      context "{del}", ->
        it "deletes character to the right", ->
          cy.get(":text:first").invoke("val", "bar").type("{leftarrow}{del}").then ($input) ->
            expect($input).to.have.value("ba")

        it "can delete a selection range of characters", ->
          cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'ar' characters
              $input.get(0).setSelectionRange(1,3)
            .get(":text:first").type("{del}").then ($input) ->
              expect($input).to.have.value("b")

        it "sets which and keyCode to 46 and does not fire keypress events", (done) ->
          cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          cy.$$(":text:first").on "keydown", _.after 2, (e) ->
            expect(e.which).to.eq 46
            expect(e.keyCode).to.eq 46
            expect(e.key).to.eq "Delete"
            done()

          cy.get(":text:first").invoke("val", "ab").type("{leftarrow}{del}")

        it "does not fire textInput event", (done) ->
          cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{del}").then -> done()

        it "does fire input event when value changes", (done) ->
          cy.$$(":text:first").on "input", (e) ->
            done()

          cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'a' characters
              $input.get(0).setSelectionRange(0,1)
            .get(":text:first").type("{del}")

        it "does not fire input event when value does not change", (done) ->
          cy.$$(":text:first").on "input", (e) ->
            done("should not have fired input")

          cy.get(":text:first").invoke("val", "ab").type("{del}").then -> done()

        it "can prevent default del movement", (done) ->
          cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 46
              e.preventDefault()

          cy.get(":text:first").invoke("val", "foo").type("{leftarrow}{del}").then ($input) ->
            expect($input).to.have.value("foo")
            done()

      context "{leftarrow}", ->
        it "can move the cursor from the end to end - 1", ->
          cy.get(":text:first").invoke("val", "bar").type("{leftarrow}n").then ($input) ->
            expect($input).to.have.value("banr")

        it "does not move the cursor if already at bounds 0", ->
          cy.get(":text:first").invoke("val", "bar").type("{selectall}{leftarrow}n").then ($input) ->
            expect($input).to.have.value("nbar")

        it "sets the cursor to the left bounds", ->
          cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'a' character
              $input.get(0).setSelectionRange(1,2)
            .get(":text:first").type("{leftarrow}n").then ($input) ->
              expect($input).to.have.value("bnar")

        it "sets the cursor to the very beginning", ->
          cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'a' character
              $input.get(0).setSelectionRange(0,1)

            .get(":text:first").type("{leftarrow}n").then ($input) ->
              expect($input).to.have.value("nbar")

        it "sets which and keyCode to 37 and does not fire keypress events", (done) ->
          cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          cy.$$(":text:first").on "keydown", (e) ->
            expect(e.which).to.eq 37
            expect(e.keyCode).to.eq 37
            expect(e.key).to.eq "ArrowLeft"
            done()

          cy.get(":text:first").invoke("val", "ab").type("{leftarrow}").then ($input) ->
            done()

        it "does not fire textInput event", (done) ->
          cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{leftarrow}").then -> done()

        it "does not fire input event", (done) ->
          cy.$$(":text:first").on "input", (e) ->
            done("input should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{leftarrow}").then -> done()

        it "can prevent default left arrow movement", (done) ->
          cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 37
              e.preventDefault()

          cy.get(":text:first").invoke("val", "foo").type("{leftarrow}d").then ($input) ->
            expect($input).to.have.value("food")
            done()

      context "{rightarrow}", ->
        it "can move the cursor from the beginning to beginning + 1", ->
          cy.get(":text:first").invoke("val", "bar").focus().then ($input) ->
            ## select the beginning
            $input.get(0).setSelectionRange(0,0)

          .get(":text:first").type("{rightarrow}n").then ($input) ->
            expect($input).to.have.value("bnar")

        it "does not move the cursor if already at end of bounds", ->
          cy.get(":text:first").invoke("val", "bar").type("{selectall}{rightarrow}n").then ($input) ->
            expect($input).to.have.value("barn")

        it "sets the cursor to the rights bounds", ->
          cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'a' character
              $input.get(0).setSelectionRange(1,2)

            .get(":text:first").type("{rightarrow}n").then ($input) ->
              expect($input).to.have.value("banr")

        it "sets the cursor to the very beginning", ->
          cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              $input.select()

            .get(":text:first").type("{leftarrow}n").then ($input) ->
              expect($input).to.have.value("nbar")

        it "sets which and keyCode to 39 and does not fire keypress events", (done) ->
          cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          cy.$$(":text:first").on "keydown", (e) ->
            expect(e.which).to.eq 39
            expect(e.keyCode).to.eq 39
            expect(e.key).to.eq "ArrowRight"
            done()

          cy.get(":text:first").invoke("val", "ab").type("{rightarrow}").then ($input) ->
            done()

        it "does not fire textInput event", (done) ->
          cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{rightarrow}").then -> done()

        it "does not fire input event", (done) ->
          cy.$$(":text:first").on "input", (e) ->
            done("input should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{rightarrow}").then -> done()

        it "can prevent default right arrow movement", (done) ->
          cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 39
              e.preventDefault()

          cy.get(":text:first").invoke("val", "foo").type("{leftarrow}{rightarrow}d").then ($input) ->
            expect($input).to.have.value("fodo")
            done()

      context "{uparrow}", ->
        beforeEach ->
          cy.$$("#comments").val("foo\nbar\nbaz")

        it "sets which and keyCode to 38 and does not fire keypress events", (done) ->
          cy.$$("#comments").on "keypress", ->
            done("should not have received keypress")

          cy.$$("#comments").on "keydown", (e) ->
            expect(e.which).to.eq 38
            expect(e.keyCode).to.eq 38
            expect(e.key).to.eq "ArrowUp"
            done()

          cy.get("#comments").type("{uparrow}").then ($input) ->
            done()

        it "does not fire textInput event", (done) ->
          cy.$$("#comments").on "textInput", (e) ->
            done("textInput should not have fired")

          cy.get("#comments").type("{uparrow}").then -> done()

        it "does not fire input event", (done) ->
          cy.$$("#comments").on "input", (e) ->
            done("input should not have fired")

          cy.get("#comments").type("{uparrow}").then -> done()

        it "up and down arrow on contenteditable", ->
          cy.$$('[contenteditable]:first').get(0).innerHTML =
                      '<div>foo</div>' +
                      '<div>bar</div>' +
                      '<div>baz</div>'

          cy.get("[contenteditable]:first")
          .type("{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33").then ($div) ->
            expect($div.get(0).innerText).to.eql("foo22\nb11ar\nbaz33\n")

        it "uparrow ignores current selection", ->
          ce = cy.$$('[contenteditable]:first').get(0)
          ce.innerHTML =
                      '<div>foo</div>' +
                      '<div>bar</div>' +
                      '<div>baz</div>'
          ## select 'bar'
          line = cy.$$('[contenteditable]:first div:nth-child(1)').get(0)
          cy.document().then (doc) ->
            ce.focus()
            doc.getSelection().selectAllChildren(line)

          cy.get("[contenteditable]:first")
          .type("{uparrow}11").then ($div) ->
            expect($div.get(0).innerText).to.eql("11foo\nbar\nbaz\n")

        it "up and down arrow on textarea", ->
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz'

          cy.get("textarea:first")
          .type("{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33").should('have.value', "foo22\nb11ar\nbaz33")

        it "increments input[type=number]", ->
          cy.get('input[type="number"]:first')
            .invoke('val', '12.34')
            .type('{uparrow}{uparrow}')
            .should('have.value', '14')


      context "{downarrow}", ->
        beforeEach ->
          cy.$$("#comments").val("foo\nbar\nbaz")

        it "sets which and keyCode to 40 and does not fire keypress events", (done) ->
          cy.$$("#comments").on "keypress", ->
            done("should not have received keypress")

          cy.$$("#comments").on "keydown", (e) ->
            expect(e.which).to.eq 40
            expect(e.keyCode).to.eq 40
            expect(e.key).to.eq "ArrowDown"
            done()

          cy.get("#comments").type("{downarrow}").then ($input) ->
            done()

        it "does not fire textInput event", (done) ->
          cy.$$("#comments").on "textInput", (e) ->
            done("textInput should not have fired")

          cy.get("#comments").type("{downarrow}").then -> done()

        it "does not fire input event", (done) ->
          cy.$$("#comments").on "input", (e) ->
            done("input should not have fired")

          cy.get("#comments").type("{downarrow}").then -> done()

        it "{downarrow} will move to EOL on textarea", ->
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz'

          cy.get("textarea:first")
          .type("{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33{leftarrow}{downarrow}44").should('have.value', "foo22\nb11ar\nbaz3344")

        it "decrements input[type='number']", ->
          cy.get('input[type="number"]:first')
            .invoke('val', '12.34')
            .type('{downarrow}{downarrow}')
            .should('have.value', '11')

        it "downarrow ignores current selection", ->
          ce = cy.$$('[contenteditable]:first').get(0)
          ce.innerHTML =
                      '<div>foo</div>' +
                      '<div>bar</div>' +
                      '<div>baz</div>'
          ## select 'foo'
          line = cy.$$('[contenteditable]:first div:first').get(0)
          cy.document().then (doc) ->
            ce.focus()
            doc.getSelection().selectAllChildren(line)

          cy.get("[contenteditable]:first")
          .type("{downarrow}22").then ($div) ->
            expect($div.get(0).innerText).to.eql("foo\n22bar\nbaz\n")

      context "{selectall}{del}", ->
        it "can select all the text and delete", ->
          cy.get(":text:first").invoke("val", "1234").type("{selectall}{del}").type("foo").then ($text) ->
            expect($text).to.have.value("foo")

        it "can select all [contenteditable] and delete", ->
          cy.get("#input-types [contenteditable]").invoke("text", "1234").type("{selectall}{del}").type("foo").then ($div) ->
            expect($div).to.have.text("foo")

      context "{selectall} then type something", ->
        it "replaces the text", ->
          cy.get("#input-with-value").type("{selectall}new").then ($text) ->
            expect($text).to.have.value("new")

      context "{enter}", ->
        it "sets which and keyCode to 13 and prevents EOL insertion", (done) ->
          cy.$$("#input-types textarea").on "keypress", _.after 2, (e) ->
            done("should not have received keypress event")

          cy.$$("#input-types textarea").on "keydown", _.after 2, (e) ->
            expect(e.which).to.eq 13
            expect(e.keyCode).to.eq 13
            expect(e.key).to.eq "Enter"
            e.preventDefault()

          cy.get("#input-types textarea").invoke("val", "foo").type("d{enter}").then ($textarea) ->
            expect($textarea).to.have.value("food")
            done()

        it "sets which and keyCode and charCode to 13 and prevents EOL insertion", (done) ->
          cy.$$("#input-types textarea").on "keypress", _.after 2, (e) ->
            expect(e.which).to.eq 13
            expect(e.keyCode).to.eq 13
            expect(e.charCode).to.eq 13
            expect(e.key).to.eq "Enter"
            e.preventDefault()

          cy.get("#input-types textarea").invoke("val", "foo").type("d{enter}").then ($textarea) ->
            expect($textarea).to.have.value("food")
            done()

        it "does not fire textInput event", (done) ->
          cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{enter}").then -> done()

        it "does not fire input event", (done) ->
          cy.$$(":text:first").on "input", (e) ->
            done("input should not have fired")

          cy.get(":text:first").invoke("val", "ab").type("{enter}").then -> done()

        it "inserts new line into textarea", ->
          cy.get("#input-types textarea").invoke("val", "foo").type("bar{enter}baz{enter}quux").then ($textarea) ->
            expect($textarea).to.have.value("foobar\nbaz\nquux")

        it "inserts new line into [contenteditable] ", ->
          cy.get("#input-types [contenteditable]:first").invoke("text", "foo")
          .type("bar{enter}baz{enter}{enter}{enter}quux").then ($div) ->
            expect($div.get(0).innerText).to.eql("foobar\nbaz\n\n\nquux\n")
            expect($div.get(0).textContent).to.eql("foobarbazquux")
            expect($div.get(0).innerHTML).to.eql("foobar<div>baz</div><div><br></div><div><br></div><div>quux</div>")

        it "inserts new line into [contenteditable] from midline", ->
          cy.get("#input-types [contenteditable]:first").invoke("text", "foo")
          .type("bar{leftarrow}{enter}baz{leftarrow}{enter}quux").then ($div) ->
            expect($div.get(0).innerText).to.eql("fooba\nba\nquuxzr\n")
            expect($div.get(0).textContent).to.eql("foobabaquuxzr")
            expect($div.get(0).innerHTML).to.eql("fooba<div>ba</div><div>quuxzr</div>")


    describe "modifiers", ->

      describe "activating modifiers", ->

        it "sends keydown event for modifiers in order", (done) ->
          $input = cy.$$("input:text:first")
          events = []
          $input.on "keydown", (e) ->
            events.push(e)

          cy.get("input:text:first").type("{shift}{ctrl}").then ->
            expect(events[0].shiftKey).to.be.true
            expect(events[0].which).to.equal(16)

            expect(events[1].ctrlKey).to.be.true
            expect(events[1].which).to.equal(17)

            $input.off("keydown")
            done()

        it "maintains modifiers for subsequent characters", (done) ->
          $input = cy.$$("input:text:first")
          events = []
          $input.on "keydown", (e) ->
            events.push(e)

          cy.get("input:text:first").type("{command}{control}ok").then ->
            expect(events[2].metaKey).to.be.true
            expect(events[2].ctrlKey).to.be.true
            expect(events[2].which).to.equal(79)

            expect(events[3].metaKey).to.be.true
            expect(events[3].ctrlKey).to.be.true
            expect(events[3].which).to.equal(75)

            $input.off("keydown")
            done()

        it "does not maintain modifiers for subsequent type commands", (done) ->
          $input = cy.$$("input:text:first")
          events = []
          $input.on "keydown", (e) ->
            events.push(e)

          cy
          .get("input:text:first")
          .type("{command}{control}")
          .type("ok")
          .then ->
            expect(events[2].metaKey).to.be.false
            expect(events[2].ctrlKey).to.be.false
            expect(events[2].which).to.equal(79)

            expect(events[3].metaKey).to.be.false
            expect(events[3].ctrlKey).to.be.false
            expect(events[3].which).to.equal(75)

            $input.off("keydown")
            done()

        it "does not maintain modifiers for subsequent click commands", (done) ->
          $button = cy.$$("button:first")
          mouseDownEvent = null
          mouseUpEvent = null
          clickEvent = null
          $button.on "mousedown", (e)-> mouseDownEvent = e
          $button.on "mouseup", (e)-> mouseUpEvent = e
          $button.on "click", (e)-> clickEvent = e

          cy
            .get("input:text:first")
            .type("{cmd}{option}")
            .get("button:first").click().then ->
              expect(mouseDownEvent.metaKey).to.be.false
              expect(mouseDownEvent.altKey).to.be.false

              expect(mouseUpEvent.metaKey).to.be.false
              expect(mouseUpEvent.altKey).to.be.false

              expect(clickEvent.metaKey).to.be.false
              expect(clickEvent.altKey).to.be.false

              $button.off "mousedown"
              $button.off "mouseup"
              $button.off "click"
              done()

        it "sends keyup event for activated modifiers when typing is finished", (done) ->
          $input = cy.$$("input:text:first")
          events = []
          $input.on "keyup", (e) ->
            events.push(e)

          cy
          .get("input:text:first")
            .type("{alt}{ctrl}{meta}{shift}ok")
          .then ->
            # first keyups should be for the chars typed, "ok"
            expect(events[0].which).to.equal(79)
            expect(events[1].which).to.equal(75)

            expect(events[2].which).to.equal(18)
            expect(events[3].which).to.equal(17)
            expect(events[4].which).to.equal(91)
            expect(events[5].which).to.equal(16)

            $input.off("keyup")
            done()

      describe "release: false", ->

        it "maintains modifiers for subsequent type commands", (done) ->
          $input = cy.$$("input:text:first")
          events = []

          $input.on "keydown", (e) ->
            events.push(e)

          cy
          .get("input:text:first")
          .type("{command}{control}", { release: false })
          .type("ok")
          .then ->
            expect(events[2].metaKey).to.be.true
            expect(events[2].ctrlKey).to.be.true
            expect(events[2].which).to.equal(79)

            expect(events[3].metaKey).to.be.true
            expect(events[3].ctrlKey).to.be.true
            expect(events[3].which).to.equal(75)

            done()

        it "maintains modifiers for subsequent click commands", (done) ->
          $button = cy.$$("button:first")
          mouseDownEvent = null
          mouseUpEvent = null
          clickEvent = null

          $button.on "mousedown", (e) -> mouseDownEvent = e
          $button.on "mouseup", (e) -> mouseUpEvent = e
          $button.on "click", (e) -> clickEvent = e

          cy
            .get("input:text:first")
            .type("{meta}{alt}", { release: false })
            .get("button:first").click().then ->
              expect(mouseDownEvent.metaKey).to.be.true
              expect(mouseDownEvent.altKey).to.be.true

              expect(mouseUpEvent.metaKey).to.be.true
              expect(mouseUpEvent.altKey).to.be.true

              expect(clickEvent.metaKey).to.be.true
              expect(clickEvent.altKey).to.be.true

              done()

        it "resets modifiers before next test", ->
          ## this test will fail if you comment out
          ## $Keyboard.resetModifiers

          $input = cy.$$("input:text:first")
          events = []

          $input.on "keyup", (e) ->
            events.push(e)

          cy
          .get("input:text:first")
          .type("a", { release: false })
          .then ->
            expect(events[0].metaKey).to.be.false
            expect(events[0].ctrlKey).to.be.false
            expect(events[0].altKey).to.be.false

      describe "changing modifiers", ->
        beforeEach ->
          @$input = cy.$$("input:text:first")
          cy.get("input:text:first").type("{command}{option}", { release: false })

        afterEach ->
          @$input.off("keydown")

        it "sends keydown event for new modifiers", (done) ->
          event = null
          @$input.on "keydown", (e)->
            event = e

          cy.get("input:text:first").type("{shift}").then ->
            expect(event.shiftKey).to.be.true
            expect(event.which).to.equal(16)
            done()

        it "does not send keydown event for already activated modifiers", (done) ->
          triggered = false
          @$input.on "keydown", (e)->
            triggered = true if e.which is 18 or e.which is 17

          cy.get("input:text:first").type("{cmd}{alt}").then ->
            expect(triggered).to.be.false
            done()

    describe "case-insensitivity", ->

      it "special chars are case-insensitive", ->
        cy.get(":text:first").invoke("val", "bar").type("{leftarrow}{DeL}").then ($input) ->
          expect($input).to.have.value("ba")

      it "modifiers are case-insensitive", (done) ->
        $input = cy.$$("input:text:first")
        alt = false
        $input.on "keydown", (e) ->
          alt = true if e.altKey

        cy.get("input:text:first").type("{aLt}").then ->
          expect(alt).to.be.true

          $input.off("keydown")
          done()

      it "letters are case-sensitive", ->
        cy.get("input:text:first").type("FoO").then ($input) ->
          expect($input).to.have.value("FoO")

    describe "click events", ->
      it "passes timeout and interval down to click", (done) ->
        input  = $("<input />").attr("id", "input-covered-in-span").prependTo(cy.$$("body"))
        span = $("<span>span on input</span>")
          .css {
            position: "absolute"
            left: input.offset().left
            top: input.offset().top
            padding: 5
            display: "inline-block"
            backgroundColor: "yellow"
          }
          .prependTo cy.$$("body")

        cy.on "command:retry", (options) ->
          expect(options.timeout).to.eq 1000
          expect(options.interval).to.eq 60
          done()

        cy.get("#input-covered-in-span").type("foobar", {timeout: 1000, interval: 60})

      it "does not issue another click event between type/type", ->
        clicked = 0

        cy.$$(":text:first").click ->
          clicked += 1

        cy.get(":text:first").type("f").type("o").then ->
          expect(clicked).to.eq 1

      it "does not issue another click event if element is already in focus from click", ->
        clicked = 0

        cy.$$(":text:first").click ->
          clicked += 1

        cy.get(":text:first").click().type("o").then ->
          expect(clicked).to.eq 1

    describe "change events", ->
      it "fires when enter is pressed and value has changed", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy.get(":text:first").invoke("val", "foo").type("bar{enter}").then ->
          expect(changed).to.eq 1

      it "fires twice when enter is pressed and then again after losing focus", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy.get(":text:first").invoke("val", "foo").type("bar{enter}baz").blur().then ->
          expect(changed).to.eq 2

      it "fires when element loses focus due to another action (click)", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy
          .get(":text:first").type("foo").then ->
            expect(changed).to.eq 0
          .get("button:first").click().then ->
            expect(changed).to.eq 1

      it "fires when element loses focus due to another action (type)", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy
          .get(":text:first").type("foo").then ->
            expect(changed).to.eq 0
          .get("textarea:first").type("bar").then ->
            expect(changed).to.eq 1

      it "fires when element is directly blurred", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy
          .get(":text:first").type("foo").blur().then ->
            expect(changed).to.eq 1

      it "fires when element is tabbed away from"#, ->
      #   changed = 0

      #   cy.$$(":text:first").change ->
      #     changed += 1

      #   cy.get(":text:first").invoke("val", "foo").type("b{tab}").then ->
      #     expect(changed).to.eq 1

      it "does not fire twice if element is already in focus between type/type", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy.get(":text:first").invoke("val", "foo").type("f").type("o{enter}").then ->
          expect(changed).to.eq 1

      it "does not fire twice if element is already in focus between clear/type", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy.get(":text:first").invoke("val", "foo").clear().type("o{enter}").then ->
          expect(changed).to.eq 1

      it "does not fire twice if element is already in focus between click/type", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy.get(":text:first").invoke("val", "foo").click().type("o{enter}").then ->
          expect(changed).to.eq 1

      it "does not fire twice if element is already in focus between type/click", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy.get(":text:first").invoke("val", "foo").type("d{enter}").click().then ->
          expect(changed).to.eq 1

      it "does not fire at all between clear/type/click", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy.get(":text:first").invoke("val", "foo").clear().type("o").click().then ($el) ->
          expect(changed).to.eq 0
          $el
        .blur()
        .then ->
          expect(changed).to.eq 1

      it "does not fire if {enter} is preventedDefault", ->
        changed = 0

        cy.$$(":text:first").keypress (e) ->
          e.preventDefault() if e.which is 13

        cy.$$(":text:first").change ->
          changed += 1

        cy.get(":text:first").invoke("val", "foo").type("b{enter}").then ->
          expect(changed).to.eq 0

      it "does not fire when enter is pressed and value hasnt changed", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy.get(":text:first").invoke("val", "foo").type("b{backspace}{enter}").then ->
          expect(changed).to.eq 0

      it "does not fire at the end of the type", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy
          .get(":text:first").type("foo").then ->
            expect(changed).to.eq 0

      it "does not fire change event if value hasnt actually changed", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy
          .get(":text:first").invoke("val", "foo").type("{backspace}{backspace}oo{enter}").blur().then ->
            expect(changed).to.eq 0

      it "does not fire if mousedown is preventedDefault which prevents element from losing focus", ->
        changed = 0

        cy.$$(":text:first").change ->
          changed += 1

        cy.$$("textarea:first").mousedown -> return false

        cy
          .get(":text:first").invoke("val", "foo").type("bar")
          .get("textarea:first").click().then ->
            expect(changed).to.eq 0

      it "does not fire hitting {enter} inside of a textarea", ->
        changed = 0

        cy.$$("textarea:first").change ->
          changed += 1

        cy
          .get("textarea:first").type("foo{enter}bar").then ->
            expect(changed).to.eq 0

      it "does not fire hitting {enter} inside of [contenteditable]", ->
        changed = 0

        cy.$$("[contenteditable]:first").change ->
          changed += 1

        cy
          .get("[contenteditable]:first").type("foo{enter}bar").then ->
            expect(changed).to.eq 0

      ## [contenteditable] does not fire ANY change events ever.
      it "does not fire at ALL for [contenteditable]", ->
        changed = 0

        cy.$$("[contenteditable]:first").change ->
          changed += 1

        cy
          .get("[contenteditable]:first").type("foo")
          .get("button:first").click().then ->
            expect(changed).to.eq 0

      it "does not fire on .clear() without blur", ->
        changed = 0

        cy.$$("input:first").change ->
          changed += 1

        cy.get("input:first").invoke('val', 'foo')
        .clear()
        .then ($el) ->
          expect(changed).to.eq 0
          $el
        .type('foo')
        .blur()
        .then ->
          expect(changed).to.eq 0

      it "fires change for single value change inputs", ->
        changed = 0
        cy.$$('input[type="date"]:first').change ->
          changed++
        cy.get('input[type="date"]:first')
          .type("1959-09-13")
          .blur()
          .then ->
            expect(changed).to.eql 1

      it "does not fire change for non-change single value input", ->
        changed = 0
        cy.$$('input[type="date"]:first').change ->
          changed++
        cy.get('input[type="date"]:first')
          .invoke('val', "1959-09-13")
          .type("1959-09-13")
          .blur()
          .then ->
            expect(changed).to.eql(0)

      it "does not fire change for type'd change that restores value", ->
        changed = 0
        cy.$$('input:first').change ->
          changed++
        cy.get('input:first')
        .invoke('val', 'foo')
        .type('{backspace}o')
        .invoke('val', 'bar')
        .type('{backspace}r')
        .blur()
        .then ->
          expect(changed).to.eql 0


    describe "caret position", ->

      it "respects being formatted by input event handlers"

      it "can arrow from maxlength", ->
        cy.get('input:first').invoke('attr', 'maxlength', "5").type('foobar{leftarrow}')
        cy.window().then (win) ->
          expect $selection.getSelectionBounds Cypress.$('input:first').get(0)
          .to.deep.eq({start:4, end:4})

      it "won't arrowright past length", ->
        cy.get('input:first').type('foo{rightarrow}{rightarrow}{rightarrow}bar{rightarrow}')
        cy.window().then (win) ->
          expect $selection.getSelectionBounds Cypress.$('input:first').get(0)
          .to.deep.eq({start:6, end:6})

      it "won't arrowleft before word", ->
        cy.get('input:first').type('oo' + '{leftarrow}{leftarrow}{leftarrow}' + 'f' + '{leftarrow}'.repeat(5))
        cy.window().then (win) ->
          expect $selection.getSelectionBounds Cypress.$('input:first').get(0)
          .to.deep.eq({start:0, end:0})

      it "leaves caret at the end of contenteditable", ->
        cy.get('[contenteditable]:first').type('foobar')
        cy.window().then (win) ->
          expect $selection.getSelectionBounds Cypress.$('[contenteditable]:first').get(0)
          .to.deep.eq({start:6, end:6})

      it "leaves caret at the end of contenteditable when prefilled", ->
        $el = cy.$$('[contenteditable]:first')
        el = $el.get(0)
        el.innerHTML = 'foo'
        cy.get('[contenteditable]:first').type('bar')
        cy.window().then (win) ->
          expect $selection.getSelectionBounds Cypress.$('[contenteditable]:first').get(0)
          .to.deep.eq({start:6, end:6})

      it "can move the caret left on contenteditable", ->
        cy.get('[contenteditable]:first').type('foo{leftarrow}{leftarrow}')
        cy.window().then (win) ->
          expect $selection.getSelectionBounds Cypress.$('[contenteditable]:first').get(0)
          .to.deep.eq({start:1, end:1})

        ##make sure caret is correct
        ## type left left
        ## make sure caret correct
        ## text is fboo
        ## fix input-mask issue

      it "leaves caret at the end of input", ->
        cy.get(':text:first').type('foobar')
        cy.window().then (win) ->
          expect $selection.getSelectionBounds Cypress.$(':text:first').get(0)
          .to.deep.eq({start:6, end:6})

      it "leaves caret at the end of textarea", ->
        cy.get('#comments').type('foobar')
        cy.window().then (win) ->
          expect $selection.getSelectionBounds Cypress.$('#comments').get(0)
          .to.deep.eq({start:6, end:6})

      it "can wrap cursor to next line in [contenteditable] with {rightarrow}", ->
        $el = cy.$$('[contenteditable]:first')
        el = $el.get(0)
        el.innerHTML = 'start'+
        '<div>middle</div>'+
        '<div>end</div>'
        cy.get('[contenteditable]:first')
        ## move cursor to beginning of div
        .type('{selectall}{leftarrow}')
        .type('{rightarrow}'.repeat(14)+'[_I_]').then ->
          expect(cy.$$('[contenteditable]:first').get(0).innerText).to.eql('start\nmiddle\ne[_I_]nd\n')

      it "can wrap cursor to prev line in [contenteditable] with {leftarrow}", ->
        $el = cy.$$('[contenteditable]:first')
        el = $el.get(0)
        el.innerHTML = 'start'+
        '<div>middle</div>'+
        '<div>end</div>'
        cy.get('[contenteditable]:first').type('{leftarrow}'.repeat(12)+'[_I_]').then ->
          expect(cy.$$('[contenteditable]:first').get(0).innerText).to.eql('star[_I_]t\nmiddle\nend\n')


      it "can wrap cursor to next line in [contenteditable] with {rightarrow} and empty lines", ->
        $el = cy.$$('[contenteditable]:first')
        el = $el.get(0)
        el.innerHTML = '<div><br></div>'.repeat(4)+
        '<div>end</div>'

        cy.get('[contenteditable]:first')
        .type('{selectall}{leftarrow}')
        # .type('foobar'+'{rightarrow}'.repeat(6)+'[_I_]').then ->
        #   expect(cy.$$('[contenteditable]:first').get(0).innerText).to.eql('foobar\n\n\n\nen[_I_]d\n')

      it "can use {rightarrow} and nested elements", ->
        $el = cy.$$('[contenteditable]:first')
        el = $el.get(0)
        el.innerHTML = '<div><b>s</b>ta<b>rt</b></div>'

        cy.get('[contenteditable]:first')
        .type('{selectall}{leftarrow}')
        .type('{rightarrow}'.repeat(3)+'[_I_]').then ->
          expect(cy.$$('[contenteditable]:first').get(0).innerText).to.eql('sta[_I_]rt\n')

      it "enter and \\n should act the same for [contenteditable]", ->

        cleanseText = (text) ->
          text.replace(/ /g, ' ')

        expectMatchInnerText = ($el , innerText) ->
          expect(cleanseText($el.get(0).innerText)).to.eql(innerText)

        ## NOTE: this may only pass in Chrome since the whitespace may be different in other browsers
        ##  even if actual and expected appear the same.
        expected = "{\n  foo:   1\n  bar:   2\n  baz:   3\n}\n"
        cy.get('[contenteditable]:first')
        .invoke('html', '<div><br></div>')
        .type('{{}{enter}  foo:   1{enter}  bar:   2{enter}  baz:   3{enter}}')
        .should ($el) ->
          expectMatchInnerText($el, expected)
        .clear()
        .type('{{}\n  foo:   1\n  bar:   2\n  baz:   3\n}')
        .should ($el) ->
          expectMatchInnerText($el, expected)


      it "enter and \\n should act the same for textarea", ->
        expected = "{\n  foo:   1\n  bar:   2\n  baz:   3\n}"
        cy.get('textarea:first')
        .clear()
        .type('{{}{enter}  foo:   1{enter}  bar:   2{enter}  baz:   3{enter}}')
        .should('have.prop', 'value', expected)
        .clear()
        .type('{{}\n  foo:   1\n  bar:   2\n  baz:   3\n}')
        .should('have.prop', 'value', expected)



    describe "{enter}", ->
      beforeEach ->
        @$forms = cy.$$("#form-submits")

      context "1 input, no 'submit' elements", ->
        it "triggers form submit", (done) ->
          @foo = {}

          @$forms.find("#single-input").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#single-input input").type("foo{enter}")

        it "triggers form submit synchronously before type logs or resolves", ->
          events = []

          cy.on "command:start", (cmd) ->
            events.push "#{cmd.get('name')}:start"

          @$forms.find("#single-input").submit (e) ->
            e.preventDefault()
            events.push "submit"

          cy.on "log:added", (attrs, log) ->
            state = log.get("state")

            if state is "pending"
              log.on "state:changed", (state) ->
                events.push "#{log.get('name')}:log:#{state}"

              events.push "#{log.get('name')}:log:#{state}"

          cy.on "command:end", (cmd) ->
            events.push "#{cmd.get('name')}:end"

          cy.get("#single-input input").type("f{enter}").then ->
            expect(events).to.deep.eq [
              "get:start", "get:log:pending", "get:end", "type:start", "type:log:pending", "submit", "type:end", "then:start"
            ]

        it "triggers 2 form submit event", ->
          submits = 0

          @$forms.find("#single-input").submit (e) ->
            e.preventDefault()
            submits += 1

          cy.get("#single-input input").type("f{enter}{enter}").then ->
            expect(submits).to.eq 2

        it "does not submit when keydown is defaultPrevented on input", (done) ->
          form = @$forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("input").keydown (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keydown is defaultPrevented on wrapper", (done) ->
          form = @$forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("div").keydown (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keydown is defaultPrevented on form", (done) ->
          form = @$forms.find("#single-input").submit -> done("err: should not have submitted")
          form.keydown (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on input", (done) ->
          form = @$forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on wrapper", (done) ->
          form = @$forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("div").keypress (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on form", (done) ->
          form = @$forms.find("#single-input").submit -> done("err: should not have submitted")
          form.keypress (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

      context "2 inputs, no 'submit' elements", ->
        it "does not trigger submit event", (done) ->
          form = @$forms.find("#no-buttons").submit -> done("err: should not have submitted")

          cy.get("#no-buttons input:first").type("f").type("{enter}").then -> done()

      context "2 inputs, no 'submit' elements but 1 button[type=button]", ->
        it "does not trigger submit event", (done) ->
          form = @$forms.find("#one-button-type-button").submit -> done("err: should not have submitted")

          cy.get("#one-button-type-button input:first").type("f").type("{enter}").then -> done()

      context "2 inputs, 1 'submit' element input[type=submit]", ->
        it "triggers form submit", (done) ->
          @$forms.find("#multiple-inputs-and-input-submit").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}")

        it "causes click event on the input[type=submit]", (done) ->
          @$forms.find("#multiple-inputs-and-input-submit input[type=submit]").click (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}")

        it "does not cause click event on the input[type=submit] if keydown is defaultPrevented on input", (done) ->
          form = @$forms.find("#multiple-inputs-and-input-submit").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#multiple-inputs-and-input-submit input:first").type("f{enter}").then -> done()

      context "2 inputs, 1 'submit' element button[type=submit]", ->
        it "triggers form submit", (done) ->
          @$forms.find("#multiple-inputs-and-button-submit").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}")

        it "causes click event on the button[type=submit]", (done) ->
          @$forms.find("#multiple-inputs-and-button-submit button[type=submit]").click (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}")

        it "does not cause click event on the button[type=submit] if keydown is defaultPrevented on input", (done) ->
          form = @$forms.find("#multiple-inputs-and-button-submit").submit ->
            done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#multiple-inputs-and-button-submit input:first").type("f{enter}").then -> done()

      context "2 inputs, 1 'submit' element button", ->
        it "triggers form submit", (done) ->
          @$forms.find("#multiple-inputs-and-button-with-no-type").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}")

        it "causes click event on the button", (done) ->
          @$forms.find("#multiple-inputs-and-button-with-no-type button").click (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}")

        it "does not cause click event on the button if keydown is defaultPrevented on input", (done) ->
          form = @$forms.find("#multiple-inputs-and-button-with-no-type").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#multiple-inputs-and-button-with-no-type input:first").type("f{enter}").then -> done()

      context "2 inputs, 2 'submit' elements", ->
        it "triggers form submit", (done) ->
          @$forms.find("#multiple-inputs-and-multiple-submits").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}")

        it "causes click event on the button", (done) ->
          @$forms.find("#multiple-inputs-and-multiple-submits button").click (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}")

        it "does not cause click event on the button if keydown is defaultPrevented on input", (done) ->
          form = @$forms.find("#multiple-inputs-and-multiple-submits").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("f{enter}").then -> done()

      context "disabled default button", ->
        beforeEach ->
          @$forms.find("#multiple-inputs-and-multiple-submits").find("button").prop("disabled", true)

        it "will not receive click event", (done) ->
          @$forms.find("#multiple-inputs-and-multiple-submits button").click -> done("err: should not receive click event")

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then -> done()

        it "will not submit the form", (done) ->
          @$forms.find("#multiple-inputs-and-multiple-submits").submit -> done("err: should not receive submit event")

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then -> done()

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.$$("input:first").keyup ->
          _.delay =>
            $(@).addClass("typed")
          , 100

        cy.get("input:first").type("f").should("have.class", "typed").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          @lastLog = log

        return null

      it "passes in $el", ->
        cy.get("input:first").type("foobar").then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("$el")).to.eq $input

      it "logs message", ->
        cy.get(":text:first").type("foobar").then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "foobar"

      it "logs delay arguments", ->
        cy.get(":text:first").type("foo", {delay: 20}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "foo, {delay: 20}"

      it "clones textarea value after the type happens", ->
        expectToHaveValueAndCoords = =>
          cmd = cy.queue.find({name: "type"})
          log = cmd.get("logs")[0]
          txt = log.get("snapshots")[1].body.find("#comments")
          expect(txt).to.have.value("foobarbaz")
          expect(log.get("coords")).to.be.ok

        cy
          .get("#comments").type("foobarbaz").then ($txt) ->
            expectToHaveValueAndCoords()
          .get("#comments").clear().type("onetwothree").then ->
            expectToHaveValueAndCoords()

      it "clones textarea value when textarea is focused first", ->
        expectToHaveValueAndNoCoords = =>
          cmd = cy.queue.find({name: "type"})
          log = cmd.get("logs")[0]
          txt = log.get("snapshots")[1].body.find("#comments")
          expect(txt).to.have.value("foobarbaz")
          expect(log.get("coords")).not.to.be.ok

        cy
          .get("#comments").focus().type("foobarbaz").then ($txt) ->
            expectToHaveValueAndNoCoords()
          .get("#comments").clear().type("onetwothree").then ->
            expectToHaveValueAndNoCoords()

      it "logs only one type event", ->
        logs = []
        types = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log)
          if log.get("name") is "type"
            types.push(log)

        cy.get(":text:first").type("foo").then ->
          expect(logs.length).to.eq(2)
          expect(types.length).to.eq(1)

      it "logs immediately before resolving", ->
        $txt = cy.$$(":text:first")

        expected = false

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "type"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq $txt.get(0)

            expected = true

        cy.get(":text:first").type("foo").then ->
        cy.get(":text:first").type("foo")

      it "snapshots before typing", ->
        expected = false

        cy.$$(":text:first").one "keydown", =>
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[0].body).to.be.an("object")

          expected = true

        cy.get(":text:first").type("foo").then ->
          expect(expected).to.be.true

      it "snapshots after typing", ->
        cy.get(":text:first").type("foo").then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(lastLog.get("snapshots")[1].body).to.be.an("object")

      it "logs deltaOptions", ->
        cy.get(":text:first").type("foo", {force: true, timeout: 1000}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "foo, {force: true, timeout: 1000}"
          expect(lastLog.invoke("consoleProps").Options).to.deep.eq {force: true, timeout: 1000}

      context "#consoleProps", ->
        it "has all of the regular options", ->
          cy.get("input:first").type("foobar").then ($input) ->
            { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($input)
            console = @lastLog.invoke("consoleProps")
            expect(console.Command).to.eq("type")
            expect(console.Typed).to.eq("foobar")
            expect(console["Applied To"]).to.eq $input.get(0)
            expect(console.Coords.x).to.be.closeTo(fromWindow.x, 1)
            expect(console.Coords.y).to.be.closeTo(fromWindow.y, 1)

        it "has a table of keys", ->
          cy.get(":text:first").type("{cmd}{option}foo{enter}b{leftarrow}{del}{enter}").then ->
            table = @lastLog.invoke("consoleProps").table()
            console.table(table.data, table.columns)
            expect(table.columns).to.deep.eq [
              "typed", "which", "keydown", "keypress", "textInput", "input", "keyup", "change", "modifiers"
            ]
            expect(table.name).to.eq "Key Events Table"
            expectedTable = {
              1: {typed: "<meta>", which: 91, keydown: true, modifiers: "meta"}
              2: {typed: "<alt>", which: 18, keydown: true, modifiers: "alt, meta"}
              3: {typed: "f", which: 70, keydown: true, keypress: true, textInput: true, input: true, keyup: true, modifiers: "alt, meta"}
              4: {typed: "o", which: 79, keydown: true, keypress: true, textInput: true, input: true, keyup: true, modifiers: "alt, meta"}
              5: {typed: "o", which: 79, keydown: true, keypress: true, textInput: true, input: true, keyup: true, modifiers: "alt, meta"}
              6: {typed: "{enter}", which: 13, keydown: true, keypress: true, keyup: true, change: true, modifiers: "alt, meta"}
              7: {typed: "b", which: 66, keydown: true, keypress: true, textInput: true, input: true, keyup: true, modifiers: "alt, meta"}
              8: {typed: "{leftarrow}", which: 37, keydown: true, keyup: true, modifiers: "alt, meta"}
              9: {typed: "{del}", which: 46, keydown: true, input: true, keyup: true, modifiers: "alt, meta"}
              10: {typed: "{enter}", which: 13, keydown: true, keypress: true, keyup: true, modifiers: "alt, meta"}
            }

            for i in [1..10]
              expect(table.data[i]).to.deep.eq(expectedTable[i])

            # table.data.forEach (item, i) ->
            #   expect(item).to.deep.eq(expectedTable[i])

            # expect(table.data).to.deep.eq(expectedTable)

        it "has no modifiers when there are none activated", ->
          cy.get(":text:first").type("f").then ->
            table = @lastLog.invoke("consoleProps").table()
            expect(table.data).to.deep.eq {
              1: {typed: "f", which: 70, keydown: true, keypress: true, textInput: true, input: true, keyup: true}
            }

        it "has a table of keys with preventedDefault", ->
          cy.$$(":text:first").keydown -> return false

          cy.get(":text:first").type("f").then ->
            table = @lastLog.invoke("consoleProps").table()
            console.table(table.data, table.columns)
            expect(table.data).to.deep.eq {
              1: {typed: "f", which: 70, keydown: "preventedDefault", keyup: true}
            }

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

        cy.noop({}).type("foo")

      it "throws when subject is not in the document", (done) ->
        typed = 0

        input = cy.$$("input:first").keypress (e) ->
          typed += 1
          input.remove()

        cy.on "fail", (err) ->
          expect(typed).to.eq 1
          expect(err.message).to.include "cy.type() failed because this element"
          done()

        cy.get("input:first").type("a").type("b")

      it "throws when not textarea or text-like", (done) ->
        cy.get("form").type("foo")

        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.type() failed because it requires a valid typeable element."
          expect(err.message).to.include "The element typed into was:"
          expect(err.message).to.include "<form id=\"by-id\">...</form>"
          expect(err.message).to.include "Cypress considers the 'body', 'textarea', any 'element' with a 'tabindex' or 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid typeable elements."
          done()

      it "throws when subject is a collection of elements", (done) ->
        cy.get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .type("foo")

        cy.on "fail", (err) =>
          expect(err.message).to.include "cy.type() can only be called on a single element. Your subject contained #{@num} elements."
          done()

      it "throws when the subject isnt visible", (done) ->
        input = cy.$$("input:text:first").show().hide()

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(2)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "cy.type() failed because this element is not visible"
          done()

        cy.get("input:text:first").type("foo")

      it "throws when subject is disabled", (done) ->
        cy.$$("input:text:first").prop("disabled", true)

        cy.on "fail", (err) =>
          ## get + type logs
          expect(@logs.length).eq(2)
          expect(err.message).to.include("cy.type() failed because this element is disabled:\n")
          done()

        cy.get("input:text:first").type("foo")

      it "throws when submitting within nested forms"

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.type("foobar")

      it "throws when input cannot be clicked", (done) ->
        $input = $("<input />")
        .attr("id", "input-covered-in-span")
        .prependTo(cy.$$("body"))

        $span = $("<span>span on button</span>")
        .css({
          position: "absolute",
          left: $input.offset().left,
          top: $input.offset().top,
          padding: 5,
          display: "inline-block",
          backgroundColor: "yellow"
        })
        .prependTo(cy.$$("body"))

        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(2)
          expect(err.message).to.include "cy.type() failed because this element"
          expect(err.message).to.include "is being covered by another element"
          done()

        cy.get("#input-covered-in-span").type("foo")

      it "throws when special characters dont exist", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq 2

          allChars = _.keys(Keyboard.specialChars).concat(_.keys(Keyboard.modifierChars)).join(", ")

          expect(err.message).to.eq "Special character sequence: '{bar}' is not recognized. Available sequences are: #{allChars}"
          done()

        cy.get(":text:first").type("foo{bar}")

      it "throws when attemping to type tab", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq 2
          expect(err.message).to.eq "{tab} isn't a supported character sequence. You'll want to use the command cy.tab(), which is not ready yet, but when it is done that's what you'll use."
          done()

        cy.get(":text:first").type("foo{tab}")

      it "throws on an empty string", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq 2
          expect(err.message).to.eq "cy.type() cannot accept an empty String. You need to actually type something."
          done()

        cy.get(":text:first").type("")

      it "allows typing spaces", ->
        cy
          .get(":text:first").type(" ")
          .should("have.value", " ")

      it "can type into input with invalid type attribute", ->
        cy.get(':text:first')
          .invoke('attr', 'type', 'asdf')
          .type('foobar')
          .should('have.value', 'foobar')

      _.each [NaN, Infinity, [], {}, null, undefined], (val) =>
        it "throws when trying to type: #{val}", (done) ->
          logs = []

          cy.on "log:added", (attrs, log) ->
            logs.push(log)

          cy.on "fail", (err) =>
            expect(@logs.length).to.eq 2
            expect(err.message).to.eq "cy.type() can only accept a String or Number. You passed in: '#{val}'"
            done()

          cy.get(":text:first").type(val)

      it "throws when type is cancelled by preventingDefault mousedown"

      it "throws when element animation exceeds timeout", (done) ->
        ## force the animation calculation to think we moving at a huge distance ;-)
        cy.stub(Cypress.utils, "getDistanceBetween").returns(100000)

        keydowns = 0

        cy.$$(":text:first").on "keydown", ->
          keydowns += 1

        cy.on "fail", (err) ->
          expect(keydowns).to.eq(0)
          expect(err.message).to.include("cy.type() could not be issued because this element is currently animating:\n")
          done()

        cy.get(":text:first").type("foo")

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get("input:first").type("f").should("have.class", "typed")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(3)
          done()

        cy.get("input:first").type("f").should("have.class", "typed")

      context "[type=date]", ->
        it "throws when chars is not a string", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(2)
            expect(err.message).to.eq("Typing into a date input with cy.type() requires a valid date with the format 'yyyy-MM-dd'. You passed: 1989")
            done()

          cy.get("#date-without-value").type(1989)

        it "throws when chars is invalid format", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(2)
            expect(err.message).to.eq("Typing into a date input with cy.type() requires a valid date with the format 'yyyy-MM-dd'. You passed: 01-01-1989")
            done()

          cy.get("#date-without-value").type("01-01-1989")

        it "throws when chars is invalid date", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(2)
            expect(err.message).to.eq("Typing into a date input with cy.type() requires a valid date with the format 'yyyy-MM-dd'. You passed: 1989-04-31")
            done()

          cy.get("#date-without-value").type("1989-04-31")

      context "[type=month]", ->
        it "throws when chars is not a string", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(2)
            expect(err.message).to.eq("Typing into a month input with cy.type() requires a valid month with the format 'yyyy-MM'. You passed: 6")
            done()

          cy.get("#month-without-value").type(6)

        it "throws when chars is invalid format", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(2)
            expect(err.message).to.eq("Typing into a month input with cy.type() requires a valid month with the format 'yyyy-MM'. You passed: 01/2000")
            done()

          cy.get("#month-without-value").type("01/2000")

        it "throws when chars is invalid month", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(2)
            expect(err.message).to.eq("Typing into a month input with cy.type() requires a valid month with the format 'yyyy-MM'. You passed: 1989-13")
            done()

          cy.get("#month-without-value").type("1989-13")

      context "[type=tel]", ->
        it "can edit tel", ->
          cy.get('#by-name > input[type="tel"]')
          .type('1234567890')
          .should('have.prop', 'value', '1234567890')

        # it "throws when chars is invalid format", (done) ->
        #   cy.on "fail", (err) =>
        #     expect(@logs.length).to.eq(2)
        #     expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 2005/W18")
        #     done()


      context "[type=week]", ->
        it "throws when chars is not a string", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(2)
            expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 23")
            done()

          cy.get("#week-without-value").type(23)

        it "throws when chars is invalid format", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(2)
            expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 2005/W18")
            done()

          cy.get("#week-without-value").type("2005/W18")

        it "throws when chars is invalid week", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(2)
            expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 1995-W60")
            done()

          cy.get("#week-without-value").type("1995-W60")

      context "[type=time]", ->
        it "throws when chars is not a string", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.equal(2)
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 9999")
            done()

          cy.get("#time-without-value").type(9999)

        it "throws when chars is invalid format (1:30)", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.equal(2)
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 1:30")
            done()

          cy.get("#time-without-value").type("1:30")

        it "throws when chars is invalid format (01:30pm)", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.equal(2)
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:30pm")
            done()

          cy.get("#time-without-value").type("01:30pm")

        it "throws when chars is invalid format (01:30:30.3333)", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.equal(2)
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:30:30.3333")
            done()

          cy.get("#time-without-value").type("01:30:30.3333")

        it "throws when chars is invalid time", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.equal(2)
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:60")
            done()

          cy.get("#time-without-value").type("01:60")

  context "#clear", ->
    it "does not change the subject", ->
      textarea = cy.$$("textarea")

      cy.get("textarea").clear().then ($textarea) ->
        expect($textarea).to.match textarea

    it "removes the current value", ->
      textarea = cy.$$("#comments")
      textarea.val("foo bar")

      ## make sure it really has that value first
      expect(textarea).to.have.value("foo bar")

      cy.get("#comments").clear().then ($textarea) ->
        expect($textarea).to.have.value("")

    it "waits until element is no longer disabled", ->
      textarea = cy.$$("#comments").val("foo bar").prop("disabled", true)

      retried = false
      clicks = 0

      textarea.on "click", ->
        clicks += 1

      cy.on "command:retry", _.after 3, ->
        textarea.prop("disabled", false)
        retried = true

      cy.get("#comments").clear().then ->
        expect(clicks).to.eq(1)
        expect(retried).to.be.true

    it "can forcibly click even when being covered by another element", ->
      $input = $("<input />")
      .attr("id", "input-covered-in-span")
      .prependTo(cy.$$("body"))

      $span = $("<span>span on input</span>")
      .css({
        position: "absolute",
        left: $input.offset().left,
        top: $input.offset().top,
        padding: 5,
        display: "inline-block",
        backgroundColor: "yellow"
      })
      .prependTo(cy.$$("body"))

      clicked = false

      $input.on "click", ->
        clicked = true

      cy.get("#input-covered-in-span").clear({force: true}).then ->
        expect(clicked).to.be.true

    it "passes timeout and interval down to click", (done) ->
      input  = $("<input />").attr("id", "input-covered-in-span").prependTo(cy.$$("body"))
      span = $("<span>span on input</span>").css(position: "absolute", left: input.offset().left, top: input.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(cy.$$("body"))

      cy.on "command:retry", (options) ->
        expect(options.timeout).to.eq 1000
        expect(options.interval).to.eq 60
        done()

      cy.get("#input-covered-in-span").clear({timeout: 1000, interval: 60})

    context "works on input type", ->
      inputTypes = [
        "date",
        "datetime",
        "datetime-local",
        "email",
        "month",
        "number",
        "password",
        "search",
        "tel",
        "text",
        "time",
        "url",
        "week"
      ]

      inputTypes.forEach (type) ->
        it type, ->
          cy.get("##{type}-with-value").clear().then ($input) ->
            expect($input.val()).to.equal("")

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.$$("input:first").keyup ->
          _.delay =>
            $(@).addClass("cleared")
          , 100

        cy.get("input:first").clear().should("have.class", "cleared").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

      it "eventually passes the assertion on multiple inputs", ->
        cy.$$("input").keyup ->
          _.delay =>
            $(@).addClass("cleared")
          , 100

        cy.get("input").invoke("slice", 0, 2).clear().should("have.class", "cleared")

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws when not a dom subject", (done) ->
        cy.on "fail", (err) -> done()

        cy.noop({}).clear()

      it "throws when subject is not in the document", (done) ->
        cleared = 0

        input = cy.$$("input:first").val("123").keydown (e) ->
          cleared += 1
          input.remove()

        cy.on "fail", (err) ->
          expect(cleared).to.eq 1
          expect(err.message).to.include "cy.clear() failed because this element"
          done()

        cy.get("input:first").clear().clear()

      it "throws if any subject isnt a textarea or text-like", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(3)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "cy.clear() failed because it requires a valid clearable element."
          expect(err.message).to.include "The element cleared was:"
          expect(err.message).to.include "<form id=\"checkboxes\">...</form>"
          expect(err.message).to.include "Cypress considers a 'textarea', any 'element' with a 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid clearable elements."
          done()

        cy.get("textarea:first,form#checkboxes").clear()

      it "throws if any subject isnt a :text", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.clear() failed because it requires a valid clearable element."
          expect(err.message).to.include "The element cleared was:"
          expect(err.message).to.include "<div id=\"dom\">...</div>"
          expect(err.message).to.include "Cypress considers a 'textarea', any 'element' with a 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid clearable elements."
          done()

        cy.get("div").clear()

      it "throws on an input radio", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.clear() failed because it requires a valid clearable element."
          expect(err.message).to.include "The element cleared was:"
          expect(err.message).to.include "<input type=\"radio\" name=\"gender\" value=\"male\">"
          expect(err.message).to.include "Cypress considers a 'textarea', any 'element' with a 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid clearable elements."
          done()

        cy.get(":radio").clear()

      it "throws on an input checkbox", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.clear() failed because it requires a valid clearable element."
          expect(err.message).to.include "The element cleared was:"
          expect(err.message).to.include "<input type=\"checkbox\" name=\"colors\" value=\"blue\">"
          expect(err.message).to.include "Cypress considers a 'textarea', any 'element' with a 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid clearable elements."
          done()

        cy.get(":checkbox").clear()

      it "throws when the subject isnt visible", (done) ->
        input = cy.$$("input:text:first").show().hide()

        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.clear() failed because this element is not visible"
          done()

        cy.get("input:text:first").clear()

      it "throws when subject is disabled", (done) ->
        cy.$$("input:text:first").prop("disabled", true)

        cy.on "fail", (err) =>
          ## get + type logs
          expect(@logs.length).eq(2)
          expect(err.message).to.include("cy.clear() failed because this element is disabled:\n")
          done()

        cy.get("input:text:first").clear()

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.clear()

      it "throws when input cannot be cleared", (done) ->
        $input = $("<input />")
        .attr("id", "input-covered-in-span")
        .prependTo(cy.$$("body"))

        $span = $("<span>span on input</span>")
        .css({
          position: "absolute",
          left: $input.offset().left,
          top: $input.offset().top,
          padding: 5,
          display: "inline-block",
          backgroundColor: "yellow"
        })
        .prependTo(cy.$$("body"))

        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(2)
          expect(err.message).to.include "cy.clear() failed because this element"
          expect(err.message).to.include "is being covered by another element"
          done()

        cy.get("#input-covered-in-span").clear()

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get("input:first").clear().should("have.class", "cleared")

      it "does not log an additional log on failure", (done) ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log)

        cy.on "fail", =>
          expect(@logs.length).to.eq(3)
          done()

        cy.get("input:first").clear().should("have.class", "cleared")

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          @lastLog = log

        return null

      it "logs immediately before resolving", ->
        $input = cy.$$("input:first")

        expected = false

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "clear"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq $input.get(0)

            expected = true

        cy.get("input:first").clear().then ->
          expect(expected).to.be.true

      it "ends", ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log) if log.get("name") is "clear"

        cy.get("input").invoke("slice", 0, 2).clear().then ->
          _.each logs, (log) ->
            expect(log.get("state")).to.eq("passed")
            expect(log.get("ended")).to.be.true

      it "snapshots after clicking", ->
        cy.get("input:first").clear().then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "logs deltaOptions", ->
        cy.get("input:first").clear({force: true, timeout: 1000}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "{force: true, timeout: 1000}"

          expect(lastLog.invoke("consoleProps").Options).to.deep.eq {force: true, timeout: 1000}

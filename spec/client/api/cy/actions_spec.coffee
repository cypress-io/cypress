describe "$Cypress.Cy Actions Commands", ->
  enterCommandTestingMode()

  context "#select", ->
    it "does not change the subject", ->
      select = @cy.$$("select[name=maps]")

      @cy.get("select[name=maps]").select("train").then ($select) ->
        expect($select).to.match select

    it "selects by value", ->
      @cy.get("select[name=maps]").select("de_train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "selects by text", ->
      @cy.get("select[name=maps]").select("train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "prioritizes value over text", ->
      @cy.get("select[name=foods]").select("Ramen").then ($select) ->
        expect($select).to.have.value("Ramen")

    it "can select an array of values", ->
      @cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    it "can select an array of texts", ->
      @cy.get("select[name=movies]").select(["The Human Condition", "There Will Be Blood"]).then ($select) ->
        expect($select.val()).to.deep.eq ["thc", "twbb"]

    it "clears previous values when providing an array", ->
      ## make sure we have a previous value
      select = @cy.$$("select[name=movies]").val(["2001"])
      expect(select.val()).to.deep.eq ["2001"]

      @cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    it "lists the input as the focused element", ->
      select = @cy.$$("select:first")

      @cy.get("select:first").select("de_train").focused().then ($focused) ->
        expect($focused.get(0)).to.eq select.get(0)

    it "causes previous input to receive blur", (done) ->
      @cy.$$("input:text:first").blur -> done()

      @cy
        .get("input:text:first").type("foo")
        .get("select:first").select("de_train")

    it "can forcibly click even when being covered by another element", (done) ->
      select  = $("<select><option>foo</option></select>").attr("id", "select-covered-in-span").prependTo(@cy.$$("body"))
      span = $("<span>span on select</span>").css(position: "absolute", left: select.offset().left, top: select.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      select.on "click", -> done()

      @cy.get("#select-covered-in-span").select("foo", {force: true})

    it "passes timeout and interval down to click", (done) ->
      select  = $("<select />").attr("id", "select-covered-in-span").prependTo(@cy.$$("body"))
      span = $("<span>span on select</span>").css(position: "absolute", left: select.offset().left, top: select.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      @cy.on "retry", (options) ->
        expect(options.timeout).to.eq 1000
        expect(options.interval).to.eq 60
        done()

      @cy.get("#select-covered-in-span").select("foobar", {timeout: 1000, interval: 60})

    it "can forcibly click even when element is invisible", (done) ->
      select = @cy.$$("select:first").hide()

      select.click -> done()

      @cy.get("select:first").select("de_dust2", {force: true})

    it "retries until <option> can be selected", ->
      option = @cy.$$("<option>foo</option>")

      @cy.on "retry", _.once =>
        @cy.$$("select:first").append option

      @cy.get("select:first").select("foo")

    it "retries until <select> is no longer disabled", ->
      select = @cy.$$("select[name=disabled]")

      @cy.on "retry", _.once =>
        select.prop("disabled", false)

      @cy.get("select[name=disabled]").select("foo")

    it "retries until <options> are no longer disabled", ->
      select = @cy.$$("select[name=opt-disabled]")

      @cy.on "retry", _.once =>
        select.find("option").prop("disabled", false)

      @cy.get("select[name=opt-disabled]").select("bar")

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(300)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.$$("select:first").change ->
          _.delay =>
            $(@).addClass("selected")
          , 100

        @cy.get("select:first").select("de_nuke").should("have.class", "selected").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get("select:first").select("de_nuke").should("have.class", "selected")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get("select:first").select("de_nuke").should("have.class", "selected")

    describe "events", ->
      it "emits click event", (done) ->
        @cy.$$("select[name=maps]").click -> done()
        @cy.get("select[name=maps]").select("train")

      it "emits change event", (done) ->
        @cy.$$("select[name=maps]").change -> done()
        @cy.get("select[name=maps]").select("train")

      it "emits focus event", (done) ->
        @cy.$$("select[name=maps]").one "focus", -> done()
        @cy.get("select[name=maps]").select("train")

      it "emits input event", (done) ->
        @cy.$$("select[name=maps]").one "input", -> done()
        @cy.get("select[name=maps]").select("train")

      it "emits all events in the correct order", ->
        fired = []
        events = ["mousedown", "focus", "mouseup", "click", "input", "change"]

        _.each events, (event) =>
          @cy.$$("select[name=maps]").one event, ->
            fired.push(event)

        @cy.get("select[name=maps]").select("train").then ->
          expect(fired).to.deep.eq events

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(100)
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.noop({}).select("foo")

        @cy.on "fail", -> done()

      it "throws when subject is not in the document", (done) ->
        selected = 0

        select = @cy.$$("select:first").change (e) ->
          selected += 1
          select.remove()

        @cy.on "fail", (err) ->
          expect(selected).to.eq 1
          expect(err.message).to.include "cy.select() failed because this element"
          done()

        @cy.get("select:first").select("de_dust2").select("de_aztec")

      it "throws when more than 1 element in the collection", (done) ->
        @cy
          .get("select").then ($selects) ->
            @num = $selects.length
            return $selects
          .select("foo")

        @cy.on "fail", (err) =>
          expect(err.message).to.include ".select() can only be called on a single <select>! Your subject contained #{@num} elements!"
          done()

      it "throws on anything other than a select", (done) ->
        @cy.get("input:first").select("foo")

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".select() can only be called on a <select>! Your subject is a: <input id=\"input\">"
          done()

      it "throws when finding duplicate values", (done) ->
        @cy.get("select[name=names]").select("bm")

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".select() matched than one option by value or text: bm"
          done()

      it "throws when passing an array to a non multiple select", (done) ->
        @cy.get("select[name=names]").select(["bm", "ss"])

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".select() was called with an array of arguments but does not have a 'multiple' attribute set!"
          done()

      it "throws when the subject isnt visible", (done) ->
        select = @cy.$$("select:first").show().hide()

        node = $Cypress.Utils.stringifyElement(select)

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.select() failed because this element is not visible"
          done()

        @cy.get("select:first").select("de_dust2")

      it "throws when value or text does not exist", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include("cy.select() failed because it could not find a single <option> with value or text matching: 'foo'")
          done()

        @cy.get("select[name=foods]").select("foo")

      it "throws when the <select> itself is disabled", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include("cy.select() failed because this element is currently disabled:")
          done()

        @cy.get("select[name=disabled]").select("foo")

      it "throws when options are disabled", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include("cy.select() failed because this <option> you are trying to select is currently disabled:")
          done()

        @cy.get("select[name=opt-disabled]").select("bar")

      it "only logs once on failure", (done) ->
        logs = []

        @Cypress.on "log", (@log) ->
          logs.push log

        @cy.on "fail", (err) ->
          ## 2 logs, 1 for cy.get, 1 for cy.select
          expect(logs.length).to.eq(2)
          done()

        @cy.get("select:first").select("does_not_exist")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs out select", ->
        @cy.get("select:first").select("de_dust2").then ->
          expect(@log.get("name")).to.eq "select"

      it "passes in $el", ->
        @cy.get("select:first").select("de_dust2").then ($select) ->
          expect(@log.get("$el")).to.eq $select

      it "snapshots before clicking", (done) ->
        @cy.$$("select:first").change =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].state).to.be.an("object")
          done()

        @cy.get("select:first").select("de_dust2").then ($select) ->

      it "snapshots after clicking", ->
        @cy.get("select:first").select("de_dust2").then ($select) ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].state).to.be.an("object")

      it "is not immediately ended", (done) ->
        @cy.$$("select:first").click =>
          expect(@log.get("state")).to.eq("pending")
          done()

        @cy.get("select:first").select("de_dust2")

      it "ends", ->
        @cy.get("select:first").select("de_dust2").then ->
          expect(@log.get("state")).to.eq("passed")

      it "#onConsole", ->
        @cy.get("select:first").select("de_dust2").then ($select) ->
          coords = @cy.getCoordinates($select)
          console = @log.attributes.onConsole()
          expect(console.Command).to.eq("select")
          expect(console.Selected).to.deep.eq ["de_dust2"]
          expect(console["Applied To"]).to.eq $select.get(0)
          expect(console.Coords.x).to.be.closeTo coords.x, 1
          expect(console.Coords.y).to.be.closeTo coords.y, 1

      it "logs only one select event", ->
        logs = []
        types = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          types.push(log) if log.get("name") is "select"

        @cy.get("select:first").select("de_dust2").then ->
          expect(logs).to.have.length(2)
          expect(types).to.have.length(1)

      it "logs deltaOptions", ->
        @cy.get("select:first").select("de_dust2", {force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(@log.attributes.onConsole().Options).to.deep.eq {force: true, timeout: 1000}

  context "#type", ->
    it "does not change the subject", ->
      input = @cy.$$("input:first")

      @cy.get("input:first").type("foo").then ($input) ->
        expect($input).to.match input

    it "changes the value", ->
      input = @cy.$$("input:text:first")

      input.val("")

      ## make sure we are starting from a
      ## clean state
      expect(input).to.have.value("")

      @cy.get("input:text:first").type("foo").then ($input) ->
        expect($input).to.have.value("foo")

    it "appends to a current value", ->
      input = @cy.$$("input:text:first")

      input.val("foo")

      ## make sure we are starting from a
      ## clean state
      expect(input).to.have.value("foo")

      @cy.get("input:text:first").type(" bar").then ($input) ->
        expect($input).to.have.value("foo bar")

    it "can type numbers", ->
      @cy.get(":text:first").type(123).then ($text) ->
        expect($text).to.have.value("123")

    it "triggers focus event on the input", (done) ->
      @cy.$$("input:text:first").focus -> done()

      @cy.get("input:text:first").type("bar")

    it "lists the input as the focused element", ->
      input = @cy.$$("input:text:first")

      @cy.get("input:text:first").type("bar").focused().then ($focused) ->
        expect($focused.get(0)).to.eq input.get(0)

    it "causes previous input to receive blur", (done) ->
      @cy.$$("input:text:first").blur -> done()

      @cy
        .get("input:text:first").type("foo")
        .get("input:text:last").type("bar")

    it "can type into contenteditable", ->
      oldText = @cy.$$("#contenteditable").text()

      @cy.get("#contenteditable").type("foo").then ($div) ->
        text = _.clean $div.text()
        expect(text).to.eq _.clean(oldText + "foo")

    it "delays 50ms before resolving", (done) ->
      waited = false

      @cy.$$(":text:first").on "change", (e) =>
        _.delay ->
          waited = true
        , 50

        @cy.on "invoke:end", ->
          expect(waited).to.be.true
          done()

      @cy.get(":text:first").type("foo{enter}")

    it "increases the timeout delta", (done) ->
      prevTimeout = @test.timeout()

      @cy.on "invoke:end", (cmd) =>
        if cmd.get("name") is "type"
          ## 40 is from 4 keys
          ## 100 is from .click + .focus delays!
          expect(@test.timeout()).to.eq 40 + 100 + 50 + prevTimeout
          done()

      @cy.get(":text:first").type("foo{enter}")

    # describe "input types", ->
      # _.each ["password", "email", "number", "date", "week", "month", "time", "datetime", "datetime-local", "search", "url"], (type) ->
        # it "accepts input [type=#{type}]", ->
        #   input = @cy.$$("<input type='#{type}' id='input-type-#{type}' />")

        #   @cy.$$("body").append(input)

        #   @cy.get("#input-type-#{type}").type("1234").then ($input) ->
        #     expect($input).to.have.value "1234"
        #     expect($input.get(0)).to.eq input.get(0)

    it "waits until element stops animating", (done) ->
      retries = []
      input   = $("<input class='slidein' />")
      input.css("animation-duration", ".3s")

      @cy.on "retry", (obj) ->
        ## this verifies the input has not been typed into
        expect(input).to.have.value("")
        retries.push(obj)

      input.on "animationstart", =>
        @cy.get(".slidein").type("foo").then ->
          expect(retries.length).to.be.gt(10)
          done()

      @cy.$$("#animation-container").append(input)

    it "does not throw when waiting for animations is disabled", ->
      @sandbox.stub(@Cypress, "config").withArgs("waitForAnimations").returns(false)

      @cy._timeout(100)

      input = $("<input class='slidein' />")
      input.css("animation-duration", ".5s")

      @cy.$$("#animation-container").append(input)

      @cy.get(".slidein").type("foo")

    it "waits until element is no longer disabled", ->
      txt = cy.$$(":text:first").prop("disabled", true)

      retried = false
      clicks = 0

      txt.on "click", ->
        clicks += 1

      @cy.on "retry", _.after 3, ->
        txt.prop("disabled", false)
        retried = true

      @cy.get(":text:first").type("foo").then ->
        expect(clicks).to.eq(1)
        expect(retried).to.be.true

    describe "delay", ->
      beforeEach ->
        @delay = 10

      it "adds delay to delta for each key sequence", ->
        @cy._timeout(50)

        timeout = @sandbox.spy @cy, "_timeout"

        @cy.get(":text:first").type("foo{enter}bar{leftarrow}").then ->
          expect(timeout).to.be.calledWith @delay * 8

      it "can cancel additional keystrokes", (done) ->
        @cy._timeout(50)

        text = @cy.$$(":text:first").keydown _.after 3, =>
          @Cypress.abort()

        @cy.on "cancel", ->
          _.delay ->
            expect(text).to.have.value("foo")
            done()
          , 50

        @cy.get(":text:first").type("foo{enter}bar{leftarrow}")

    describe "events", ->
      it "receives keydown event", (done) ->
        input = @cy.$$(":text:first")

        input.get(0).addEventListener "keydown", (e) =>
          obj = _(e).pick("altKey", "bubbles", "cancelable", "charCode", "ctrlKey", "detail", "keyCode", "view", "layerX", "layerY", "location", "metaKey", "pageX", "pageY", "repeat", "shiftKey", "type", "which")
          expect(obj).to.deep.eq {
            altKey: false
            bubbles: true
            cancelable: true
            charCode: 0 ## deprecated
            ctrlKey: false
            detail: 0
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
            view: @cy.private("window")
            which: 65 ## deprecated but fired by chrome
          }
          done()

        @cy.get(":text:first").type("a")

      it "receives keypress event", (done) ->
        input = @cy.$$(":text:first")

        input.get(0).addEventListener "keypress", (e) =>
          obj = _(e).pick("altKey", "bubbles", "cancelable", "charCode", "ctrlKey", "detail", "keyCode", "view", "layerX", "layerY", "location", "metaKey", "pageX", "pageY", "repeat", "shiftKey", "type", "which")
          expect(obj).to.deep.eq {
            altKey: false
            bubbles: true
            cancelable: true
            charCode: 97 ## deprecated
            ctrlKey: false
            detail: 0
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
            view: @cy.private("window")
            which: 97 ## deprecated
          }
          done()

        @cy.get(":text:first").type("a")

      it "receives keyup event", (done) ->
        input = @cy.$$(":text:first")

        input.get(0).addEventListener "keyup", (e) =>
          obj = _(e).pick("altKey", "bubbles", "cancelable", "charCode", "ctrlKey", "detail", "keyCode", "view", "layerX", "layerY", "location", "metaKey", "pageX", "pageY", "repeat", "shiftKey", "type", "which")
          expect(obj).to.deep.eq {
            altKey: false
            bubbles: true
            cancelable: true
            charCode: 0 ## deprecated
            ctrlKey: false
            detail: 0
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
            view: @cy.private("window")
            which: 65 ## deprecated but fired by chrome
          }
          done()

        @cy.get(":text:first").type("a")

      it "receives textInput event", (done) ->
        input = @cy.$$(":text:first")

        input.get(0).addEventListener "textInput", (e) =>
          obj = _(e).pick "bubbles", "cancelable", "charCode", "data", "detail", "keyCode", "layerX", "layerY", "pageX", "pageY", "type", "view", "which"
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
            view: @cy.private("window")
            which: 0
          }
          done()

        @cy.get(":text:first").type("a")

      it "receives input event", (done) ->
        input = @cy.$$(":text:first")

        input.get(0).addEventListener "input", (e) =>
          obj = _(e).pick "bubbles", "cancelable", "type"
          expect(obj).to.deep.eq {
            bubbles: true
            cancelable: false
            type: "input"
          }
          done()

        @cy.get(":text:first").type("a")

      it "fires events in the correct order"

      it "fires events for each key stroke"

    describe "value changing", ->
      it "changes the elements value", ->
        @cy.get(":text:first").type("a").then ($text) ->
          expect($text).to.have.value("a")

      it "changes the elements value for multiple keys", ->
        @cy.get(":text:first").type("foo").then ($text) ->
          expect($text).to.have.value("foo")

      it "can change input[type=number] values", ->
        @cy.get("#input-types [type=number]").type("12").then ($text) ->
          expect($text).to.have.value("12")

      it "inserts text after existing text", ->
        @cy.get(":text:first").invoke("val", "foo").type(" bar").then ($text) ->
          expect($text).to.have.value("foo bar")

      it "inserts text after existing text on input[type=number]", ->
        @cy.get("#input-types [type=number]").invoke("val", "12").type("34").then ($text) ->
          expect($text).to.have.value("1234")

      it "overwrites text when currently has selection", ->
        ## when the text is clicked we want to
        ## select everything in it
        @cy.$$(":text:first").val("0").click ->
          $(@).select()

        @cy.get(":text:first").type("50").then ($input) ->
          expect($input).to.have.value("50")

      it "overwrites text on input[type=number] when input has existing text", ->
        ## when the text is clicked we want to
        ## select everything in it
        @cy.$$("#input-types [type=number]").val("0").click ->
          $(@).select()

        @cy.get("#input-types [type=number]").type("50").then ($input) ->
          expect($input).to.have.value("50")

      it "can change input[type=email] values", ->
        @cy.get("#input-types [type=email]").type("brian@foo.com").then ($text) ->
          expect($text).to.have.value("brian@foo.com")

      it "inserts text after existing text on input[type=email]", ->
        @cy.get("#input-types [type=email]").invoke("val", "brian@foo.c").type("om").then ($text) ->
          expect($text).to.have.value("brian@foo.com")

      it "can change input[type=password] values", ->
        @cy.get("#input-types [type=password]").type("password").then ($text) ->
          expect($text).to.have.value("password")

      it "inserts text after existing text on input[type=password]", ->
        @cy.get("#input-types [type=password]").invoke("val", "pass").type("word").then ($text) ->
          expect($text).to.have.value("password")

      it "can change [contenteditable] values", ->
        @cy.get("#input-types [contenteditable]").type("foo").then ($div) ->
          expect($div).to.have.text("foo")

      it "inserts text after existing text on [contenteditable]", ->
        @cy.get("#input-types [contenteditable]").invoke("text", "foo").type(" bar").then ($text) ->
          expect($text).to.have.text("foo bar")

      # it "can change input[type=date] values", ->
      #   @cy.get("#input-types [type=date").type("1986-03-14").then ($text) ->
      #     expect($text).to.have.value("1986-03-14")

      # it "inserts text after existing text on input[type=date]", ->
      #   @cy.get("#input-types [type=date").invoke("val", "pass").type("word").then ($text) ->
      #     expect($text).to.have.value("date")

      it "automatically moves the caret to the end if value is changed manually", ->
        @cy.$$(":text:first").keypress (e) ->
          e.preventDefault()

          key = String.fromCharCode(e.which)

          $input = $(e.target)

          val = $input.val()

          $input.val(val + key + "-")

        @cy.get(":text:first").type("foo").then ($input) ->
          expect($input).to.have.value("f-o-o-")

      it "automatically moves the caret to the end if value is changed manually asynchronously", ->
        @cy.$$(":text:first").keypress (e) ->
          key = String.fromCharCode(e.which)

          $input = $(e.target)

          _.defer ->
            val = $input.val()
            $input.val(val + "-")

        @cy.get(":text:first").type("foo").then ($input) ->
          expect($input).to.have.value("f-o-o-")

      it "does not fire keypress when keydown is preventedDefault", (done) ->
        @cy.$$(":text:first").get(0).addEventListener "keypress", (e) ->
          done("should not have received keypress event")

        @cy.$$(":text:first").get(0).addEventListener "keydown", (e) ->
          e.preventDefault()

        @cy.get(":text:first").type("foo").then -> done()

      it "does not insert key when keydown is preventedDefault", ->
        @cy.$$(":text:first").get(0).addEventListener "keydown", (e) ->
          e.preventDefault()

        @cy.get(":text:first").type("foo").then ($text) ->
          expect($text).to.have.value("")

      it "does not insert key when keypress is preventedDefault", ->
        @cy.$$(":text:first").get(0).addEventListener "keypress", (e) ->
          e.preventDefault()

        @cy.get(":text:first").type("foo").then ($text) ->
          expect($text).to.have.value("")

      it "does not fire textInput when keypress is preventedDefault", (done) ->
        @cy.$$(":text:first").get(0).addEventListener "textInput", (e) ->
          done("should not have received textInput event")

        @cy.$$(":text:first").get(0).addEventListener "keypress", (e) ->
          e.preventDefault()

        @cy.get(":text:first").type("foo").then -> done()

      it "does not insert key when textInput is preventedDefault", ->
        @cy.$$(":text:first").get(0).addEventListener "textInput", (e) ->
          e.preventDefault()

        @cy.get(":text:first").type("foo").then ($text) ->
          expect($text).to.have.value("")

      it "does not fire input when textInput is preventedDefault", (done) ->
        @cy.$$(":text:first").get(0).addEventListener "input", (e) ->
          done("should not have received input event")

        @cy.$$(":text:first").get(0).addEventListener "textInput", (e) ->
          e.preventDefault()

        @cy.get(":text:first").type("foo").then -> done()

      it "preventing default to input event should not affect anything", ->
        @cy.$$(":text:first").get(0).addEventListener "input", (e) ->
          e.preventDefault()

        @cy.get(":text:first").type("foo").then ($input) ->
          expect($input).to.have.value("foo")

    describe "specialChars", ->
      context "{{}", ->
        it "sets which and keyCode to 219", (done) ->
          @cy.$$(":text:first").on "keydown", (e) ->
            expect(e.which).to.eq 219
            expect(e.keyCode).to.eq 219
            done()

          @cy.get(":text:first").invoke("val", "ab").type("{{}")

        it "fires keypress event with 219 charCode", (done) ->
          @cy.$$(":text:first").on "keypress", (e) ->
            expect(e.charCode).to.eq 219
            expect(e.which).to.eq 219
            expect(e.keyCode).to.eq 219
            done()

          @cy.get(":text:first").invoke("val", "ab").type("{{}")

        it "fires textInput event with e.data", (done) ->
          @cy.$$(":text:first").on "textInput", (e) ->
            expect(e.originalEvent.data).to.eq "{"
            done()

          @cy.get(":text:first").invoke("val", "ab").type("{{}")

        it "fires input event", (done) ->
          @cy.$$(":text:first").on "input", (e) ->
            done()

          @cy.get(":text:first").invoke("val", "ab").type("{{}")

        it "can prevent default character insertion", ->
          @cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 219
              e.preventDefault()

          @cy.get(":text:first").invoke("val", "foo").type("{{}").then ($input) ->
            expect($input).to.have.value("foo")

      context "{esc}", ->
        it "sets which and keyCode to 27 and does not fire keypress events", (done) ->
          @cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          @cy.$$(":text:first").on "keydown", (e) ->
            expect(e.which).to.eq 27
            expect(e.keyCode).to.eq 27
            done()

          @cy.get(":text:first").invoke("val", "ab").type("{esc}")

        it "does not fire textInput event", (done) ->
          @cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{esc}").then -> done()

        it "does not fire input event", (done) ->
          @cy.$$(":text:first").on "input", (e) ->
            done("input should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{esc}").then -> done()

        it "can prevent default esc movement", (done) ->
          @cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 27
              e.preventDefault()

          @cy.get(":text:first").invoke("val", "foo").type("d{esc}").then ($input) ->
            expect($input).to.have.value("food")
            done()

      context "{backspace}", ->
        it "backspaces character to the left", ->
          @cy.get(":text:first").invoke("val", "bar").type("{leftarrow}{backspace}").then ($input) ->
            expect($input).to.have.value("br")

        it "can backspace a selection range of characters", ->
          @cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'ar' characters
              b = bililiteRange($input.get(0))
              b.bounds([1, 3]).select()
            .get(":text:first").type("{backspace}").then ($input) ->
              expect($input).to.have.value("b")

        it "sets which and keyCode to 8 and does not fire keypress events", (done) ->
          @cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          @cy.$$(":text:first").on "keydown", _.after 2, (e) ->
            expect(e.which).to.eq 8
            expect(e.keyCode).to.eq 8
            done()

          @cy.get(":text:first").invoke("val", "ab").type("{leftarrow}{backspace}")

        it "does not fire textInput event", (done) ->
          @cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{backspace}").then -> done()

        it "does fire input event when value changes", (done) ->
          @cy.$$(":text:first").on "input", (e) ->
            done()

          @cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'a' characters
              b = bililiteRange($input.get(0))
              b.bounds([1, 2]).select()
            .get(":text:first").type("{backspace}")

        it "does not fire input event when value does not change", (done) ->
          @cy.$$(":text:first").on "input", (e) ->
            done("should not have fired input")

          @cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## set the range at the beggining
              b = bililiteRange($input.get(0))
              b.bounds([0, 0]).select()
            .get(":text:first").type("{backspace}").then -> done()

        it "can prevent default backspace movement", (done) ->
          @cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 8
              e.preventDefault()

          @cy.get(":text:first").invoke("val", "foo").type("{leftarrow}{backspace}").then ($input) ->
            expect($input).to.have.value("foo")
            done()

      context "{del}", ->
        it "deletes character to the right", ->
          @cy.get(":text:first").invoke("val", "bar").type("{leftarrow}{del}").then ($input) ->
            expect($input).to.have.value("ba")

        it "can delete a selection range of characters", ->
          @cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'ar' characters
              b = bililiteRange($input.get(0))
              b.bounds([1, 3]).select()
            .get(":text:first").type("{del}").then ($input) ->
              expect($input).to.have.value("b")

        it "sets which and keyCode to 46 and does not fire keypress events", (done) ->
          @cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          @cy.$$(":text:first").on "keydown", _.after 2, (e) ->
            expect(e.which).to.eq 46
            expect(e.keyCode).to.eq 46
            done()

          @cy.get(":text:first").invoke("val", "ab").type("{leftarrow}{del}")

        it "does not fire textInput event", (done) ->
          @cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{del}").then -> done()

        it "does fire input event when value changes", (done) ->
          @cy.$$(":text:first").on "input", (e) ->
            done()

          @cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'a' characters
              b = bililiteRange($input.get(0))
              b.bounds([1, 2]).select()
            .get(":text:first").type("{del}")

        it "does not fire input event when value does not change", (done) ->
          @cy.$$(":text:first").on "input", (e) ->
            done("should not have fired input")

          @cy.get(":text:first").invoke("val", "ab").type("{del}").then -> done()

        it "can prevent default del movement", (done) ->
          @cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 46
              e.preventDefault()

          @cy.get(":text:first").invoke("val", "foo").type("{leftarrow}{del}").then ($input) ->
            expect($input).to.have.value("foo")
            done()

      context "{leftarrow}", ->
        it "can move the cursor from the end to end - 1", ->
          @cy.get(":text:first").invoke("val", "bar").type("{leftarrow}n").then ($input) ->
            expect($input).to.have.value("banr")

        it "does not move the cursor if already at bounds 0", ->
          @cy.get(":text:first").invoke("val", "bar").type("{selectall}{leftarrow}n").then ($input) ->
            expect($input).to.have.value("nbar")

        it "sets the cursor to the left bounds", ->
          @cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'a' character
              b = bililiteRange($input.get(0))
              b.bounds([1, 2]).select()
            .get(":text:first").type("{leftarrow}n").then ($input) ->
              expect($input).to.have.value("bnar")

        it "sets the cursor to the very beginning", ->
          @cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'a' character
              b = bililiteRange($input.get(0))
              b.bounds("all").select()
            .get(":text:first").type("{leftarrow}n").then ($input) ->
              expect($input).to.have.value("nbar")

        it "sets which and keyCode to 37 and does not fire keypress events", (done) ->
          @cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          @cy.$$(":text:first").on "keydown", (e) ->
            expect(e.which).to.eq 37
            expect(e.keyCode).to.eq 37
            done()

          @cy.get(":text:first").invoke("val", "ab").type("{leftarrow}").then ($input) ->
            done()

        it "does not fire textInput event", (done) ->
          @cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{leftarrow}").then -> done()

        it "does not fire input event", (done) ->
          @cy.$$(":text:first").on "input", (e) ->
            done("input should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{leftarrow}").then -> done()

        it "can prevent default left arrow movement", (done) ->
          @cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 37
              e.preventDefault()

          @cy.get(":text:first").invoke("val", "foo").type("{leftarrow}d").then ($input) ->
            expect($input).to.have.value("food")
            done()

      context "{rightarrow}", ->
        it "can move the cursor from the beginning to beginning + 1", ->
          @cy.get(":text:first").invoke("val", "bar").focus().then ($input) ->
            ## select the all characters
            b = bililiteRange($input.get(0))
            b.bounds("start").select()
          .get(":text:first").type("{rightarrow}n").then ($input) ->
            expect($input).to.have.value("bnar")

        it "does not move the cursor if already at end of bounds", ->
          @cy.get(":text:first").invoke("val", "bar").type("{selectall}{rightarrow}n").then ($input) ->
            expect($input).to.have.value("barn")

        it "sets the cursor to the rights bounds", ->
          @cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the 'a' character
              b = bililiteRange($input.get(0))
              b.bounds([1, 2]).select()
            .get(":text:first").type("{rightarrow}n").then ($input) ->
              expect($input).to.have.value("banr")

        it "sets the cursor to the very beginning", ->
          @cy
            .get(":text:first").invoke("val", "bar").focus().then ($input) ->
              ## select the all characters
              b = bililiteRange($input.get(0))
              b.bounds("all").select()
            .get(":text:first").type("{leftarrow}n").then ($input) ->
              expect($input).to.have.value("nbar")

        it "sets which and keyCode to 39 and does not fire keypress events", (done) ->
          @cy.$$(":text:first").on "keypress", ->
            done("should not have received keypress")

          @cy.$$(":text:first").on "keydown", (e) ->
            expect(e.which).to.eq 39
            expect(e.keyCode).to.eq 39
            done()

          @cy.get(":text:first").invoke("val", "ab").type("{rightarrow}").then ($input) ->
            done()

        it "does not fire textInput event", (done) ->
          @cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{rightarrow}").then -> done()

        it "does not fire input event", (done) ->
          @cy.$$(":text:first").on "input", (e) ->
            done("input should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{rightarrow}").then -> done()

        it "can prevent default right arrow movement", (done) ->
          @cy.$$(":text:first").on "keydown", (e) ->
            if e.keyCode is 39
              e.preventDefault()

          @cy.get(":text:first").invoke("val", "foo").type("{leftarrow}{rightarrow}d").then ($input) ->
            expect($input).to.have.value("fodo")
            done()

      context "{selectall}{del}", ->
        it "can select all the text and delete", ->
          @cy.get(":text:first").invoke("val", "1234").type("{selectall}{del}").type("foo").then ($text) ->
            expect($text).to.have.value("foo")

        it "can select all [contenteditable] and delete", ->
          @cy.get("#input-types [contenteditable]").invoke("text", "1234").type("{selectall}{del}").type("foo").then ($div) ->
            expect($div).to.have.text("foo")

      context "{enter}", ->
        it "sets which and keyCode to 13 and prevents EOL insertion", (done) ->
          @cy.$$("#input-types textarea").on "keypress", _.after 2, (e) ->
            done("should not have received keypress event")

          @cy.$$("#input-types textarea").on "keydown", _.after 2, (e) ->
            expect(e.which).to.eq 13
            expect(e.keyCode).to.eq 13
            e.preventDefault()

          @cy.get("#input-types textarea").invoke("val", "foo").type("d{enter}").then ($textarea) ->
            expect($textarea).to.have.value("food")
            done()

        it "sets which and keyCode and charCode to 13 and prevents EOL insertion", (done) ->
          @cy.$$("#input-types textarea").on "keypress", _.after 2, (e) ->
            expect(e.which).to.eq 13
            expect(e.keyCode).to.eq 13
            expect(e.charCode).to.eq 13
            e.preventDefault()

          @cy.get("#input-types textarea").invoke("val", "foo").type("d{enter}").then ($textarea) ->
            expect($textarea).to.have.value("food")
            done()

        it "does not fire textInput event", (done) ->
          @cy.$$(":text:first").on "textInput", (e) ->
            done("textInput should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{enter}").then -> done()

        it "does not fire input event", (done) ->
          @cy.$$(":text:first").on "input", (e) ->
            done("input should not have fired")

          @cy.get(":text:first").invoke("val", "ab").type("{enter}").then -> done()

        it "inserts new line into textarea", ->
          @cy.get("#input-types textarea").invoke("val", "foo").type("bar{enter}baz{enter}quux").then ($textarea) ->
            expect($textarea).to.have.value("foobar\nbaz\nquux")

        it "inserts new line into [contenteditable]", ->
          @cy.get("#input-types [contenteditable]").invoke("text", "foo").type("bar{enter}baz{enter}quux").then ($div) ->
            expect($div).to.have.text("foobar\nbaz\nquux")

    describe "click events", ->
      it "passes timeout and interval down to click", (done) ->
        input  = $("<input />").attr("id", "input-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span on input</span>").css(position: "absolute", left: input.offset().left, top: input.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

        @cy.on "retry", (options) ->
          expect(options.timeout).to.eq 1000
          expect(options.interval).to.eq 60
          done()

        @cy.get("#input-covered-in-span").type("foobar", {timeout: 1000, interval: 60})

      it "can forcibly click even when element is invisible", (done) ->
        input = @cy.$$("input:first").hide()

        input.click -> done()

        @cy.get("input:first").click({force: true})

      it "can forcibly click even when being covered by another element", (done) ->
        input  = $("<input />").attr("id", "input-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span on input</span>").css(position: "absolute", left: input.offset().left, top: input.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

        input.on "click", -> done()

        @cy.get("#input-covered-in-span").type("foo", {force: true})

      it "does not issue another click event between type/type", ->
        clicked = 0

        @cy.$$(":text:first").click ->
          clicked += 1

        @cy.get(":text:first").type("f").type("o").then ->
          expect(clicked).to.eq 1

      it "does not issue another click event if element is already in focus from click", ->
        clicked = 0

        @cy.$$(":text:first").click ->
          clicked += 1

        @cy.get(":text:first").click().type("o").then ->
          expect(clicked).to.eq 1

    describe "change events", ->
      it "fires when enter is pressed and value has changed", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.get(":text:first").invoke("val", "foo").type("bar{enter}").then ->
          expect(changed).to.eq 1

      it "fires twice when enter is pressed and then again after losing focus", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.get(":text:first").invoke("val", "foo").type("bar{enter}baz").blur().then ->
          expect(changed).to.eq 2

      it "fires when element loses focus due to another action (click)", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy
          .get(":text:first").type("foo").then ->
            expect(changed).to.eq 0
          .get("button:first").click().then ->
            expect(changed).to.eq 1

      it "fires when element loses focus due to another action (type)", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy
          .get(":text:first").type("foo").then ->
            expect(changed).to.eq 0
          .get("textarea:first").type("bar").then ->
            expect(changed).to.eq 1

      it "fires when element is directly blurred", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy
          .get(":text:first").type("foo").blur().then ->
            expect(changed).to.eq 1

      it "fires when element is tabbed away from"#, ->
      #   changed = 0

      #   @cy.$$(":text:first").change ->
      #     changed += 1

      #   @cy.get(":text:first").invoke("val", "foo").type("b{tab}").then ->
      #     expect(changed).to.eq 1

      it "does not fire twice if element is already in focus between type/type", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.get(":text:first").invoke("val", "foo").type("f").type("o{enter}").then ->
          expect(changed).to.eq 1

      it "does not fire twice if element is already in focus between clear/type", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.get(":text:first").invoke("val", "foo").clear().type("o{enter}").then ->
          expect(changed).to.eq 1

      it "does not fire twice if element is already in focus between click/type", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.get(":text:first").invoke("val", "foo").click().type("o{enter}").then ->
          expect(changed).to.eq 1

      it "does not fire twice if element is already in focus between type/click", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.get(":text:first").invoke("val", "foo").type("d{enter}").click().then ->
          expect(changed).to.eq 1

      it "does not fire at all between clear/type/click", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.get(":text:first").invoke("val", "foo").clear().type("o").click().then ->
          expect(changed).to.eq 0

      it "does not fire if {enter} is preventedDefault", ->
        changed = 0

        @cy.$$(":text:first").keypress (e) ->
          e.preventDefault() if e.which is 13

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.get(":text:first").invoke("val", "foo").type("b{enter}").then ->
          expect(changed).to.eq 0

      it "does not fire when enter is pressed and value hasnt changed", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.get(":text:first").invoke("val", "foo").type("b{backspace}{enter}").then ->
          expect(changed).to.eq 0

      it "does not fire at the end of the type", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy
          .get(":text:first").type("foo").then ->
            expect(changed).to.eq 0

      it "does not fire change event if value hasnt actually changed", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy
          .get(":text:first").invoke("val", "foo").type("{backspace}{backspace}oo{enter}").blur().then ->
            expect(changed).to.eq 0

      it "does not fire if mousedown is preventedDefault which prevents element from losing focus", ->
        changed = 0

        @cy.$$(":text:first").change ->
          changed += 1

        @cy.$$("textarea:first").mousedown -> return false

        @cy
          .get(":text:first").invoke("val", "foo").type("bar")
          .get("textarea:first").click().then ->
            expect(changed).to.eq 0

      it "does not fire hitting {enter} inside of a textarea", ->
        changed = 0

        @cy.$$("textarea:first").change ->
          changed += 1

        @cy
          .get("textarea:first").type("foo{enter}bar").then ->
            expect(changed).to.eq 0

      it "does not fire hitting {enter} inside of [contenteditable]", ->
        changed = 0

        @cy.$$("[contenteditable]:first").change ->
          changed += 1

        @cy
          .get("[contenteditable]:first").type("foo{enter}bar").then ->
            expect(changed).to.eq 0

      ## [contenteditable] does not fire ANY change events ever!
      it "does not fire at ALL for [contenteditable]", ->
        changed = 0

        @cy.$$("[contenteditable]:first").change ->
          changed += 1

        @cy
          .get("[contenteditable]:first").type("foo")
          .get("button:first").click().then ->
            expect(changed).to.eq 0

    describe "caret position", ->
      it "leaves caret at the end of the input"

      it "always types at the end of the input"

    describe "{enter}", ->
      beforeEach ->
        @forms = @cy.$$("#form-submits")

      context "1 input, no 'submit' elements", ->
        it "triggers form submit", (done) ->
          @forms.find("#single-input").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#single-input input").type("foo{enter}")

        it "triggers form submit synchronously before type logs or resolves", ->
          events = []

          @cy.on "invoke:start", (log) ->
            events.push "#{log.get('name')}:start"

          @forms.find("#single-input").submit (e) ->
            e.preventDefault()
            events.push "submit"

          @Cypress.on "log", (log) ->
            state = log.get("state")

            if state is "pending"
              log.on "state:changed", (state) ->
                events.push "#{log.get('name')}:log:#{state}"

              events.push "#{log.get('name')}:log:#{state}"

          @cy.on "invoke:end", (log) ->
            events.push "#{log.get('name')}:end"

          @cy.get("#single-input input").type("f{enter}").then ->
            expect(events).to.deep.eq [
              "get:start", "get:log:pending", "get:end", "type:start", "type:log:pending", "submit", "type:end", "then:start"
            ]

        it "triggers 2 form submit event", ->
          submits = 0

          @forms.find("#single-input").submit (e) ->
            e.preventDefault()
            submits += 1

          @cy.get("#single-input input").type("f{enter}{enter}").then ->
            expect(submits).to.eq 2

        it "does not submit when keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("input").keydown (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keydown is defaultPrevented on wrapper", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("div").keydown (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keydown is defaultPrevented on form", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.keydown (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on input", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on wrapper", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("div").keypress (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on form", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.keypress (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

      context "2 inputs, no 'submit' elements", ->
        it "does not trigger submit event", (done) ->
          form = @forms.find("#no-buttons").submit -> done("err: should not have submitted")

          @cy.get("#no-buttons input:first").type("f").type("{enter}").then -> done()

      context "2 inputs, no 'submit' elements but 1 button[type=button]", ->
        it "does not trigger submit event", (done) ->
          form = @forms.find("#one-button-type-button").submit -> done("err: should not have submitted")

          @cy.get("#one-button-type-button input:first").type("f").type("{enter}").then -> done()

      context "2 inputs, 1 'submit' element input[type=submit]", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-input-submit").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}")

        it "causes click event on the input[type=submit]", (done) ->
          @forms.find("#multiple-inputs-and-input-submit input[type=submit]").click (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}")

        it "does not cause click event on the input[type=submit] if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-input-submit").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#multiple-inputs-and-input-submit input:first").type("f{enter}").then -> done()

      context "2 inputs, 1 'submit' element button[type=submit]", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-button-submit").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}")

        it "causes click event on the button[type=submit]", (done) ->
          @forms.find("#multiple-inputs-and-button-submit button[type=submit]").click (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}")

        it "does not cause click event on the button[type=submit] if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-button-submit").submit ->
            done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#multiple-inputs-and-button-submit input:first").type("f{enter}").then -> done()

      context "2 inputs, 1 'submit' element button", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-button-with-no-type").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}")

        it "causes click event on the button", (done) ->
          @forms.find("#multiple-inputs-and-button-with-no-type button").click (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}")

        it "does not cause click event on the button if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-button-with-no-type").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#multiple-inputs-and-button-with-no-type input:first").type("f{enter}").then -> done()

      context "2 inputs, 2 'submit' elements", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}")

        it "causes click event on the button", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits button").click (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}")

        it "does not cause click event on the button if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-multiple-submits").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("f{enter}").then -> done()

      context "disabled default button", ->
        beforeEach ->
          @forms.find("#multiple-inputs-and-multiple-submits").find("button").prop("disabled", true)

        it "will not receive click event", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits button").click -> done("err: should not receive click event")

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then -> done()

        it "will not submit the form", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits").submit -> done("err: should not receive submit event")

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then -> done()

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.$$("input:first").keyup ->
          _.delay =>
            $(@).addClass("typed")
          , 100

        @cy.get("input:first").type("f").should("have.class", "typed").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get("input:first").type("f").should("have.class", "typed")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get("input:first").type("f").should("have.class", "typed")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "passes in $el", ->
        @cy.get("input:first").type("foobar").then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "logs message", ->
        @cy.get(":text:first").type("foobar").then ->
          expect(@log.get("message")).to.eq "foobar"

      it "logs delay arguments", ->
        @cy.get(":text:first").type("foo", {delay: 20}).then ->
          expect(@log.get("message")).to.eq "foo, {delay: 20}"

      it "clones textarea value after the type happens", ->
        expectToHaveValueAndCoords = =>
          cmd = @cy.commands.findWhere({name: "type"})
          log = cmd.get("logs")[0]
          txt = log.get("snapshots")[1].state.find("#comments")
          expect(txt).to.have.value("foobarbaz")
          expect(log.get("coords")).to.be.ok

        @cy
          .get("#comments").type("foobarbaz").then ($txt) ->
            expectToHaveValueAndCoords()
          .get("#comments").clear().type("onetwothree").then ->
            expectToHaveValueAndCoords()

      it "clones textarea value when textarea is focused first", ->
        expectToHaveValueAndNoCoords = =>
          cmd = @cy.commands.findWhere({name: "type"})
          log = cmd.get("logs")[0]
          txt = log.get("snapshots")[1].state.find("#comments")
          expect(txt).to.have.value("foobarbaz")
          expect(log.get("coords")).not.to.be.ok

        @cy
          .get("#comments").focus().type("foobarbaz").then ($txt) ->
            expectToHaveValueAndNoCoords()
          .get("#comments").clear().type("onetwothree").then ->
            expectToHaveValueAndNoCoords()

      it "logs only one type event", ->
        logs = []
        types = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          types.push(log) if log.get("name") is "type"

        @cy.get(":text:first").type("foo").then ->
          expect(logs).to.have.length(2)
          expect(types).to.have.length(1)

      it "logs immediately before resolving", (done) ->
        input = @cy.$$(":text:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "type"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get(":text:first").type("foo")

      it "snapshots before typing", (done) ->
        @cy.$$(":text:first").keydown =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].state).to.be.an("object")
          done()

        @cy.get(":text:first").type("foo")

      it "snapshots after typing", ->
        @cy.get(":text:first").type("foo").then ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].state).to.be.an("object")

      it "logs deltaOptions", ->
        @cy.get(":text:first").type("foo", {force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "foo, {force: true, timeout: 1000}"
          expect(@log.attributes.onConsole().Options).to.deep.eq {force: true, timeout: 1000}

      context "#onConsole", ->
        it "has all of the regular options", ->
          @cy.get("input:first").type("foobar").then ($input) ->
            coords = @cy.getCoordinates($input)
            console = @log.attributes.onConsole()
            expect(console.Command).to.eq("type")
            expect(console.Typed).to.eq("foobar")
            expect(console["Applied To"]).to.eq $input.get(0)
            expect(console.Coords.x).to.be.closeTo coords.x, 1
            expect(console.Coords.y).to.be.closeTo coords.y, 1

        it "has a table of keys", ->
          @cy.get(":text:first").type("foo{enter}b{leftarrow}{del}{enter}").then ->
            table = @log.attributes.onConsole().table()
            console.table(table.data, table.columns)
            expect(table.columns).to.deep.eq [
              "typed", "which", "keydown", "keypress", "textInput", "input", "keyup", "change"
            ]
            expect(table.name).to.eq "Key Events Table"
            expect(table.data).to.deep.eq {
              1: {typed: "f", which: 70, keydown: true, keypress: true, textInput: true, input: true, keyup: true}
              2: {typed: "o", which: 79, keydown: true, keypress: true, textInput: true, input: true, keyup: true}
              3: {typed: "o", which: 79, keydown: true, keypress: true, textInput: true, input: true, keyup: true}
              4: {typed: "{enter}", which: 13, keydown: true, keypress: true, keyup: true, change: true}
              5: {typed: "b", which: 66, keydown: true, keypress: true, textInput: true, input: true, keyup: true}
              6: {typed: "{leftarrow}", which: 37, keydown: true, keyup: true}
              7: {typed: "{del}", which: 46, keydown: true, input: true, keyup: true}
              8: {typed: "{enter}", which: 13, keydown: true, keypress: true, keyup: true, change: true}
            }

        it "has a table of keys with preventedDefault", ->
          @cy.$$(":text:first").keydown -> return false

          @cy.get(":text:first").type("f").then ->
            table = @log.attributes.onConsole().table()
            console.table(table.data, table.columns)
            expect(table.data).to.deep.eq {
              1: {typed: "f", which: 70, keydown: "preventedDefault", keyup: true}
            }

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.noop({}).type("foo")

        @cy.on "fail", -> done()

      it "throws when subject is not in the document", (done) ->
        typed = 0

        input = @cy.$$("input:first").keypress (e) ->
          typed += 1
          input.remove()

        @cy.on "fail", (err) ->
          expect(typed).to.eq 1
          expect(err.message).to.include "cy.type() failed because this element"
          done()

        @cy.get("input:first").type("a").type("b")

      it "throws when not textarea or :text", (done) ->
        @cy.get("form").type("foo")

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".type() can only be called on textarea or :text! Your subject is a: <form id=\"by-id\">...</form>"
          done()

      it "throws when subject is a collection of elements", (done) ->
        @cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .type("foo")

        @cy.on "fail", (err) =>
          expect(err.message).to.include ".type() can only be called on a single textarea or :text! Your subject contained #{@num} elements!"
          done()

      it "throws when the subject isnt visible", (done) ->
        input = @cy.$$("input:text:first").show().hide()

        node = $Cypress.Utils.stringifyElement(input)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(2)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.type() failed because this element is not visible"
          done()

        @cy.get("input:text:first").type("foo")

      it "throws when subject is disabled", (done) ->
        @cy.$$("input:text:first").prop("disabled", true)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          ## get + type logs
          expect(logs.length).eq(2)
          expect(err.message).to.include("cy.type() failed because this element is disabled:\n")
          done()

        @cy.get("input:text:first").type("foo")

      it "throws when submitting within nested forms"

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.type("foobar")

      it "throws when input cannot be clicked", (done) ->
        @cy._timeout(200)

        input  = $("<input />").attr("id", "input-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: input.offset().left, top: input.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(2)
          expect(err.message).to.include "cy.type() failed because this element is being covered by another element"
          done()

        @cy.get("#input-covered-in-span").type("foo")

      it "throws when special characters dont exist", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq 2
          allChars = _.keys(@Cypress.Keyboard.specialChars).join(", ")
          expect(err.message).to.eq "Special character sequence: '{bar}' is not recognized. Available sequences are: #{allChars}"
          done()

        @cy.get(":text:first").type("foo{bar}")

      it "throws when attemping to type tab", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq 2
          expect(err.message).to.eq "{tab} isn't a supported character sequence. You'll want to use the command: 'cy.tab()' which is not ready yet, but when it is done that's what you'll use."
          done()

        @cy.get(":text:first").type("foo{tab}")

      it "throws on an empty string", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq 2
          expect(err.message).to.eq ".type() cannot accept an empty String! You need to actually type something."
          done()

        @cy.get(":text:first").type("")

      _.each [NaN, Infinity, [], {}, null, undefined], (val) =>
        it "throws when trying to type: #{val}", (done) ->
          logs = []

          @Cypress.on "log", (log) ->
            logs.push(log)

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq 2
            expect(err.message).to.eq ".type() can only accept a String or Number. You passed in: '#{val}'"
            done()

          @cy.get(":text:first").type(val)

      it "throws when type is cancelled by preventingDefault mousedown"

      it "throws when element animation exceeds timeout", (done) ->
        @cy._timeout(100)

        input = $("<input class='slidein' />")
        input.css("animation-duration", ".5s")

        @cy.$$("#animation-container").append(input)

        @cy.on "fail", (err) ->
          expect(input).to.have.value("")
          expect(err.message).to.include("cy.type() could not be issued because this element is currently animating:\n")
          done()

        input.on "animationstart", =>
          @cy.get(".slidein").type("foo")

  context "#clear", ->
    it "does not change the subject", ->
      textarea = @cy.$$("textarea")

      @cy.get("textarea").clear().then ($textarea) ->
        expect($textarea).to.match textarea

    it "removes the current value", ->
      textarea = @cy.$$("#comments")
      textarea.val("foo bar")

      ## make sure it really has that value first
      expect(textarea).to.have.value("foo bar")

      @cy.get("#comments").clear().then ($textarea) ->
        expect($textarea).to.have.value("")

    it "waits until element is no longer disabled", ->
      textarea = @cy.$$("#comments").val("foo bar").prop("disabled", true)

      retried = false
      clicks = 0

      textarea.on "click", ->
        clicks += 1

      @cy.on "retry", _.after 3, ->
        textarea.prop("disabled", false)
        retried = true

      @cy.get("#comments").clear().then ->
        expect(clicks).to.eq(1)
        expect(retried).to.be.true

    it "can forcibly click even when being covered by another element", (done) ->
      input  = $("<input />").attr("id", "input-covered-in-span").prependTo(@cy.$$("body"))
      span = $("<span>span on input</span>").css(position: "absolute", left: input.offset().left, top: input.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      input.on "click", -> done()

      @cy.get("#input-covered-in-span").clear({force: true})

    it "passes timeout and interval down to click", (done) ->
      input  = $("<input />").attr("id", "input-covered-in-span").prependTo(@cy.$$("body"))
      span = $("<span>span on input</span>").css(position: "absolute", left: input.offset().left, top: input.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      @cy.on "retry", (options) ->
        expect(options.timeout).to.eq 1000
        expect(options.interval).to.eq 60
        done()

      @cy.get("#input-covered-in-span").clear({timeout: 1000, interval: 60})

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.$$("input:first").keyup ->
          _.delay =>
            $(@).addClass("cleared")
          , 100

        @cy.get("input:first").clear().should("have.class", "cleared").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually passes the assertion on multiple inputs", ->
        @cy.$$("input").keyup ->
          _.delay =>
            $(@).addClass("cleared")
          , 100

        @cy.get("input").invoke("slice", 0, 2).clear().should("have.class", "cleared")

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get("input:first").clear().should("have.class", "cleared")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get("input:first").clear().should("have.class", "cleared")

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.on "fail", (err) -> done()

        @cy.noop({}).clear()

      it "throws when subject is not in the document", (done) ->
        cleared = 0

        input = @cy.$$("input:first").val("123").keydown (e) ->
          cleared += 1
          input.remove()

        @cy.on "fail", (err) ->
          expect(cleared).to.eq 1
          expect(err.message).to.include "cy.clear() failed because this element"
          done()

        @cy.get("input:first").clear().clear()

      it "throws if any subject isnt a textarea", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(3)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <form id=\"checkboxes\">...</form>"
          done()

        @cy.get("textarea:first,form#checkboxes").clear()

      it "throws if any subject isnt a :text", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <div id=\"dom\">...</div>"
          done()

        @cy.get("div").clear()

      it "throws on an input radio", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"radio\" name=\"gender\" value=\"male\">"
          done()

        @cy.get(":radio").clear()

      it "throws on an input checkbox", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"checkbox\" name=\"colors\" value=\"blue\">"
          done()

        @cy.get(":checkbox").clear()

      it "throws when the subject isnt visible", (done) ->
        input = @cy.$$("input:text:first").show().hide()

        node = $Cypress.Utils.stringifyElement(input)

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.clear() failed because this element is not visible"
          done()

        @cy.get("input:text:first").clear()

      it "throws when subject is disabled", (done) ->
        @cy.$$("input:text:first").prop("disabled", true)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          ## get + type logs
          expect(logs.length).eq(2)
          expect(err.message).to.include("cy.clear() failed because this element is disabled:\n")
          done()

        @cy.get("input:text:first").clear()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.clear()

      it "throws when input cannot be cleared", (done) ->
        @cy._timeout(200)

        input  = $("<input />").attr("id", "input-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: input.offset().left, top: input.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(2)
          expect(err.message).to.include "cy.clear() failed because this element is being covered by another element"
          done()

        @cy.get("#input-covered-in-span").clear()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        input = @cy.$$("input:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "clear"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get("input:first").clear()

      it "ends", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log) if log.get("name") is "clear"

        @cy.get("input").invoke("slice", 0, 2).clear().then ->
          _.each logs, (log) ->
            expect(log.get("state")).to.eq("passed")
            expect(log.get("end")).to.be.true

      it "snapshots after clicking", ->
        @cy.get("input:first").clear().then ($input) ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "logs deltaOptions", ->
        @cy.get("input:first").clear({force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{force: true, timeout: 1000}"

          expect(@log.attributes.onConsole().Options).to.deep.eq {force: true, timeout: 1000}

  context "#check", ->
    it "does not change the subject", ->
      inputs = @cy.$("[name=colors]")

      @cy.get("[name=colors]").check().then ($inputs) ->
        expect($inputs.length).to.eq(3)
        expect($inputs.toArray()).to.deep.eq(inputs.toArray())

    it "changes the subject if specific value passed to check", ->
      checkboxes = @cy.$("[name=colors]")

      @cy.get("[name=colors]").check(["blue", "red"]).then ($chk) ->
        expect($chk.length).to.eq(2)

        blue = checkboxes.filter("[value=blue]")
        red  = checkboxes.filter("[value=red]")

        expect($chk.get(0)).to.eq(blue.get(0))
        expect($chk.get(1)).to.eq(red.get(0))

    it "filters out values which were not found", ->
      checkboxes = @cy.$("[name=colors]")

      @cy.get("[name=colors]").check(["blue", "purple"]).then ($chk) ->
        expect($chk.length).to.eq(1)

        blue = checkboxes.filter("[value=blue]")

        expect($chk.get(0)).to.eq(blue.get(0))

    it "changes the subject when matching values even if noop", ->
      checked = $("<input type='checkbox' name='colors' value='blue' checked>")
      @cy.$("[name=colors]").parent().append(checked)

      checkboxes = @cy.$("[name=colors]")

      @cy.get("[name=colors]").check("blue").then ($chk) ->
        expect($chk.length).to.eq(2)

        blue = checkboxes.filter("[value=blue]")

        expect($chk.get(0)).to.eq(blue.get(0))
        expect($chk.get(1)).to.eq(blue.get(1))

    it "checks a checkbox", ->
      @cy.get(":checkbox[name='colors'][value='blue']").check().then ($checkbox) ->
        expect($checkbox).to.be.checked

    it "checks a radio", ->
      @cy.get(":radio[name='gender'][value='male']").check().then ($radio) ->
        expect($radio).to.be.checked

    it "is a noop if already checked", (done) ->
      checkbox = ":checkbox[name='colors'][value='blue']"
      @cy.$$(checkbox).prop("checked", true)
      @cy.$$(checkbox).change ->
        done("should not fire change event")
      @cy.get(checkbox).check()
      @cy.on "end", -> done()

    it "can check a collection", ->
      @cy.get("[name=colors]").check().then ($inputs) ->
        $inputs.each (i, el) ->
          expect($(el)).to.be.checked

    it "can check a specific value from a collection", ->
      @cy.get("[name=colors]").check("blue").then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 1
        expect($inputs.filter("[value=blue]")).to.be.checked

    it "can check multiple values from a collection", ->
      @cy.get("[name=colors]").check(["blue", "green"]).then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 2
        expect($inputs.filter("[value=blue],[value=green]")).to.be.checked

    it "can forcibly click even when being covered by another element", (done) ->
      checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prependTo(@cy.$$("body"))
      span = $("<span>span on checkbox</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      checkbox.on "click", -> done()

      @cy.get("#checkbox-covered-in-span").check({force: true})

    it "passes timeout and interval down to click", (done) ->
      checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prependTo(@cy.$$("body"))
      span = $("<span>span on checkbox</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      @cy.on "retry", (options) ->
        expect(options.timeout).to.eq 1000
        expect(options.interval).to.eq 60
        done()

      @cy.get("#checkbox-covered-in-span").check({timeout: 1000, interval: 60})

    it "waits until element is no longer disabled", ->
      chk = cy.$$(":checkbox:first").prop("disabled", true)

      retried = false
      clicks = 0

      chk.on "click", ->
        clicks += 1

      @cy.on "retry", _.after 3, ->
        chk.prop("disabled", false)
        retried = true

      @cy.get(":checkbox:first").check().then ->
        expect(clicks).to.eq(1)
        expect(retried).to.be.true

    it "delays 50ms before resolving", (done) ->
      waited = false

      @cy.$$(":checkbox:first").on "change", (e) =>
        _.delay ->
          waited = true
        , 50

        @cy.on "invoke:end", ->
          expect(waited).to.be.true
          done()

      @cy.get(":checkbox:first").check()

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.$$(":checkbox:first").click ->
          _.delay =>
            $(@).addClass("checked")
          , 100

        @cy.get(":checkbox:first").check().should("have.class", "checked").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually passes the assertion on multiple :checkboxs", ->
        @cy.$$(":checkbox").click ->
          _.delay =>
            $(@).addClass("checked")
          , 100

        @cy.get(":checkbox").invoke("slice", 0, 2).check().should("have.class", "checked")

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get(":checkbox:first").check().should("have.class", "checked")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get(":checkbox:first").check().should("have.class", "checked")

    describe "events", ->
      it "emits click event", (done) ->
        @cy.$$("[name=colors][value=blue]").click -> done()
        @cy.get("[name=colors]").check("blue")

      it "emits change event", (done) ->
        @cy.$$("[name=colors][value=blue]").change -> done()
        @cy.get("[name=colors]").check("blue")

      it "emits focus event", (done) ->
        @cy.$$("[name=colors][value=blue]").focus -> done()
        @cy.get("[name=colors]").check("blue")

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when subject isnt dom", (done) ->
        @cy.noop({}).check()

        @cy.on "fail", (err) -> done()

      it "throws when subject is not in the document", (done) ->
        checked = 0

        checkbox = @cy.$$(":checkbox:first").click (e) ->
          checked += 1
          checkbox.remove()
          return false

        @cy.on "fail", (err) ->
          expect(checked).to.eq 1
          expect(err.message).to.include "cy.check() failed because this element"
          done()

        @cy.get(":checkbox:first").check().check()

      it "throws when subject isnt a checkbox or radio", (done) ->
        ## this will find multiple forms
        @cy.get("form").check()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".check() can only be called on :checkbox and :radio! Your subject contains a: <form id=\"by-id\">...</form>"
          done()

      it "throws when any member of the subject isnt a checkbox or radio", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include ".check() can only be called on :checkbox and :radio! Your subject contains a: <textarea id=\"comments\"></textarea>"
          done()

        ## find a textare which should blow up
        ## the textarea is the last member of the subject
        @cy.get(":checkbox,:radio,#comments").check()

      it "throws when any member of the subject isnt visible", (done) ->
        chk = @cy.$$(":checkbox").first().hide()

        node = $Cypress.Utils.stringifyElement(chk.last())

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(chk.length + 1)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.check() failed because this element is not visible"
          done()

        @cy.get(":checkbox:first").check()

      it "throws when subject is disabled", (done) ->
        @cy.$$(":checkbox:first").prop("disabled", true)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          ## get + type logs
          expect(logs.length).eq(2)
          expect(err.message).to.include("cy.check() failed because this element is disabled:\n")
          done()

        @cy.get(":checkbox:first").check()

      it "still ensures visibility even during a noop", (done) ->
        chk = @cy.$$(":checkbox")
        chk.show().last().hide()

        node = $Cypress.Utils.stringifyElement(chk.last())

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(chk.length + 1)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.check() failed because this element is not visible"
          done()

        @cy.get(":checkbox").check()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.check()

      it "throws when input cannot be clicked", (done) ->
        @cy._timeout(200)

        checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(2)
          expect(err.message).to.include "cy.check() failed because this element is being covered by another element"
          done()

        @cy.get("#checkbox-covered-in-span").check()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        chk = @cy.$$(":checkbox:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "check"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        @cy.get(":checkbox:first").check()

      it "snapshots before clicking", (done) ->
        @cy.$$(":checkbox:first").change =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].state).to.be.an("object")
          done()

        @cy.get(":checkbox:first").check()

      it "snapshots after clicking", ->
        @cy.get(":checkbox:first").check().then ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].state).to.be.an("object")

      it "logs only 1 check event on click of 1 checkbox", ->
        logs = []
        checks = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          checks.push(log) if log.get("name") is "check"

        @cy.get("[name=colors][value=blue]").check().then ->
          expect(logs).to.have.length(2)
          expect(checks).to.have.length(1)

      it "logs only 1 check event on click of 1 radio", ->
        logs = []
        radios = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          radios.push(log) if log.get("name") is "check"

        @cy.get("[name=gender][value=female]").check().then ->
          expect(logs).to.have.length(2)
          expect(radios).to.have.length(1)

      it "logs only 1 check event on checkbox with 1 matching value arg", ->
        logs = []
        checks = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          checks.push(log) if log.get("name") is "check"

        @cy.get("[name=colors]").check("blue").then ->
          expect(logs).to.have.length(2)
          expect(checks).to.have.length(1)

      it "logs only 1 check event on radio with 1 matching value arg", ->
        logs = []
        radios = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          radios.push(log) if log.get("name") is "check"

        @cy.get("[name=gender]").check("female").then ->
          expect(logs).to.have.length(2)
          expect(radios).to.have.length(1)

      it "passes in $el", ->
        @cy.get("[name=colors][value=blue]").check().then ($input) ->
          expect(@log.get("$el").get(0)).to.eq $input.get(0)

      it "passes in coords", ->
        @cy.get("[name=colors][value=blue]").check().then ($input) ->
          coords = @cy.getCoordinates($input)
          expect(@log.get("coords")).to.deep.eq coords

      it "ends command when checkbox is already checked", ->
        @cy.get("[name=colors][value=blue]").check().check().then ->
          expect(@log.get("state")).eq("passed")

      it "#onConsole", ->
        @cy.get("[name=colors][value=blue]").check().then ($input) ->
          coords = @cy.getCoordinates($input)
          console = @log.attributes.onConsole()
          expect(console.Command).to.eq "check"
          expect(console["Applied To"]).to.eq @log.get("$el").get(0)
          expect(console.Elements).to.eq 1
          expect(console.Coords).to.deep.eq coords

      it "#onConsole when checkbox is already checked", ->
        @cy.get("[name=colors][value=blue]").invoke("prop", "checked", true).check().then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already checked. No operation took place."
            Options: undefined
          }

      it "#onConsole when radio is already checked", ->
        @cy.get("[name=gender][value=male]").check().check().then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This radio was already checked. No operation took place."
            Options: undefined
          }

      it "#onConsole when checkbox with value is already checked", ->
        @cy.$$("[name=colors][value=blue]").prop("checked", true)

        @cy.get("[name=colors]").check("blue").then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already checked. No operation took place."
            Options: undefined
          }

      it "logs deltaOptions", ->
        @cy.get("[name=colors][value=blue]").check({force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(@log.attributes.onConsole().Options).to.deep.eq {force: true, timeout: 1000}

  context "#uncheck", ->
    it "does not change the subject", ->
      inputs = @cy.$("[name=birds]")

      @cy.get("[name=birds]").uncheck().then ($inputs) ->
        expect($inputs.length).to.eq(2)
        expect($inputs.toArray()).to.deep.eq(inputs.toArray())

    it "changes the subject if specific value passed to check", ->
      checkboxes = @cy.$("[name=birds]")

      @cy.get("[name=birds]").check(["cockatoo", "amazon"]).then ($chk) ->
        expect($chk.length).to.eq(2)

        cockatoo = checkboxes.filter("[value=cockatoo]")
        amazon   = checkboxes.filter("[value=amazon]")

        expect($chk.get(0)).to.eq(cockatoo.get(0))
        expect($chk.get(1)).to.eq(amazon.get(0))

    it "filters out values which were not found", ->
      checkboxes = @cy.$("[name=birds]")

      @cy.get("[name=birds]").check(["cockatoo", "parrot"]).then ($chk) ->
        expect($chk.length).to.eq(1)

        cockatoo = checkboxes.filter("[value=cockatoo]")

        expect($chk.get(0)).to.eq(cockatoo.get(0))

    it "changes the subject when matching values even if noop", ->
      checked = $("<input type='checkbox' name='birds' value='cockatoo'>")
      @cy.$("[name=birds]").parent().append(checked)

      checkboxes = @cy.$("[name=birds]")

      @cy.get("[name=birds]").check("cockatoo").then ($chk) ->
        expect($chk.length).to.eq(2)

        cockatoo = checkboxes.filter("[value=cockatoo]")

        expect($chk.get(0)).to.eq(cockatoo.get(0))
        expect($chk.get(1)).to.eq(cockatoo.get(1))

    it "unchecks a checkbox", ->
      @cy.get("[name=birds][value=cockatoo]").uncheck().then ($checkbox) ->
        expect($checkbox).not.to.be.checked

    it "unchecks a checkbox by value", ->
      @cy.get("[name=birds]").uncheck("cockatoo").then ($checkbox) ->
        expect($checkbox.filter(":checked").length).to.eq 0
        expect($checkbox.filter("[value=cockatoo]")).not.to.be.checked

    it "unchecks multiple checkboxes by values", ->
      @cy.get("[name=birds]").uncheck(["cockatoo", "amazon"]).then ($checkboxes) ->
        expect($checkboxes.filter(":checked").length).to.eq 0
        expect($checkboxes.filter("[value=cockatoo],[value=amazon]")).not.to.be.checked

    it "is a noop if already unchecked", (done) ->
      checkbox = "[name=birds][value=cockatoo]"
      @cy.$$(checkbox).prop("checked", false).change ->
        done("should not fire change event")
      @cy.get(checkbox).uncheck()
      @cy.on "end", -> done()

    it "can forcibly click even when being covered by another element", (done) ->
      checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prop("checked", true).prependTo(@cy.$$("body"))
      span = $("<span>span on checkbox</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      checkbox.on "click", -> done()

      @cy.get("#checkbox-covered-in-span").uncheck({force: true})

    it "passes timeout and interval down to click", (done) ->
      checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prop("checked", true).prependTo(@cy.$$("body"))
      span = $("<span>span on checkbox</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

      @cy.on "retry", (options) ->
        expect(options.timeout).to.eq 1000
        expect(options.interval).to.eq 60
        done()

      @cy.get("#checkbox-covered-in-span").uncheck({timeout: 1000, interval: 60})

    it "waits until element is no longer disabled", ->
      chk = cy.$$(":checkbox:first").prop("checked", true).prop("disabled", true)

      retried = false
      clicks = 0

      chk.on "click", ->
        clicks += 1

      @cy.on "retry", _.after 3, ->
        chk.prop("disabled", false)
        retried = true

      @cy.get(":checkbox:first").uncheck().then ->
        expect(clicks).to.eq(1)
        expect(retried).to.be.true

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.$$(":checkbox:first").prop("checked", true).click ->
          _.delay =>
            $(@).addClass("unchecked")
          , 100

        @cy.get(":checkbox:first").uncheck().should("have.class", "unchecked").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually passes the assertion on multiple :checkboxs", ->
        @cy.$$(":checkbox").prop("checked", true).click ->
          _.delay =>
            $(@).addClass("unchecked")
          , 100

        @cy.get(":checkbox").invoke("slice", 0, 2).uncheck().should("have.class", "unchecked")

      it "eventually fails the assertion", (done) ->
        @cy.$$(":checkbox:first").prop("checked", true)

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get(":checkbox:first").uncheck().should("have.class", "unchecked")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get(":checkbox:first").uncheck().should("have.class", "unchecked")

    describe "events", ->
      it "emits click event", (done) ->
        @cy.$$("[name=colors][value=blue]").prop("checked", true).click -> done()
        @cy.get("[name=colors]").uncheck("blue")

      it "emits change event", (done) ->
        @cy.$$("[name=colors][value=blue]").prop("checked", true).change -> done()
        @cy.get("[name=colors]").uncheck("blue")

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws specifically on a radio", (done) ->
        @cy.get(":radio").uncheck()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".uncheck() can only be called on :checkbox!"
          done()

      it "throws if not a checkbox", (done) ->
        @cy.noop({}).uncheck()

        @cy.on "fail", -> done()

      it "throws when any member of the subject isnt visible", (done) ->
        ## grab the first 3 checkboxes!
        chk = @cy.$$(":checkbox").slice(0, 3).show()

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          node = $Cypress.Utils.stringifyElement(chk.last())
          len  = (chk.length * 2) + 6
          expect(logs).to.have.length(len)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.uncheck() failed because this element is not visible"
          done()

        @cy
          .get(":checkbox").invoke("slice", 0, 3).check().last().invoke("hide")
          .get(":checkbox").invoke("slice", 0, 3).uncheck()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.uncheck()

      it "throws when subject is not in the document", (done) ->
        unchecked = 0

        checkbox = @cy.$$(":checkbox:first").prop("checked", true).click (e) ->
          unchecked += 1
          checkbox.prop("checked", true)
          checkbox.remove()
          return false

        @cy.on "fail", (err) ->
          expect(unchecked).to.eq 1
          expect(err.message).to.include "cy.uncheck() failed because this element"
          done()

        @cy.get(":checkbox:first").uncheck().uncheck()

      it "throws when input cannot be clicked", (done) ->
        @cy._timeout(200)

        checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prop("checked", true).prependTo(@cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(2)
          expect(err.message).to.include "cy.uncheck() failed because this element is being covered by another element"
          done()

        @cy.get("#checkbox-covered-in-span").uncheck()

      it "throws when subject is disabled", (done) ->
        @cy.$$(":checkbox:first").prop("checked", true).prop("disabled", true)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          ## get + type logs
          expect(logs.length).eq(2)
          expect(err.message).to.include("cy.uncheck() failed because this element is disabled:\n")
          done()

        @cy.get(":checkbox:first").uncheck()

    describe ".log", ->
      beforeEach ->
        @cy.$$("[name=colors][value=blue]").prop("checked", true)

        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        chk = @cy.$$(":checkbox:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "uncheck"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        @cy.get(":checkbox:first").check().uncheck()

      it "snapshots before unchecking", (done) ->
        @cy.$$(":checkbox:first").change =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].state).to.be.an("object")
          done()

        @cy.get(":checkbox:first").invoke("prop", "checked", true).uncheck()

      it "snapshots after unchecking", ->
        @cy.get(":checkbox:first").invoke("prop", "checked", true).uncheck().then ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].state).to.be.an("object")

      it "logs only 1 uncheck event", ->
        logs = []
        unchecks = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          unchecks.push(log) if log.get("name") is "uncheck"

        @cy.get("[name=colors][value=blue]").uncheck().then ->
          expect(logs).to.have.length(2)
          expect(unchecks).to.have.length(1)

      it "logs only 1 uncheck event on uncheck with 1 matching value arg", ->
        logs = []
        unchecks = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          unchecks.push(log) if log.get("name") is "uncheck"

        @cy.get("[name=colors]").uncheck("blue").then ->
          expect(logs).to.have.length(2)
          expect(unchecks).to.have.length(1)

      it "passes in $el", ->
        @cy.get("[name=colors][value=blue]").uncheck().then ($input) ->
          expect(@log.get("$el").get(0)).to.eq $input.get(0)

      it "ends command when checkbox is already unchecked", ->
        @cy.get("[name=colors][value=blue]").invoke("prop", "checked", false).uncheck().then ->
          expect(@log.get("state")).eq("passed")

      it "#onConsole", ->
        @cy.get("[name=colors][value=blue]").uncheck().then ($input) ->
          coords = @cy.getCoordinates($input)
          console = @log.attributes.onConsole()
          expect(console.Command).to.eq "uncheck"
          expect(console["Applied To"]).to.eq @log.get("$el").get(0)
          expect(console.Elements).to.eq 1
          expect(console.Coords).to.deep.eq coords

      it "#onConsole when checkbox is already unchecked", ->
        @cy.get("[name=colors][value=blue]").invoke("prop", "checked", false).uncheck().then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "uncheck"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already unchecked. No operation took place."
            Options: undefined
          }

      it "#onConsole when checkbox with value is already unchecked", ->
        @cy.get("[name=colors][value=blue]").invoke("prop", "checked", false)
        @cy.get("[name=colors]").uncheck("blue").then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "uncheck"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already unchecked. No operation took place."
            Options: undefined
          }

      it "logs deltaOptions", ->
        @cy.get("[name=colors][value=blue]").check().uncheck({force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(@log.attributes.onConsole().Options).to.deep.eq {force: true, timeout: 1000}

  context "#submit", ->
    it "does not change the subject when default actions is prevented", ->
      form = @cy.$$("form:first").on "submit", -> return false

      @cy.get("form:first").submit().then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "works with native event listeners", ->
      submitted = false

      @cy.$$("form:first").get(0).addEventListener "submit", ->
        submitted = true

      @cy.get("form:first").submit().then ->
        expect(submitted).to.be.true

    it "bubbles up to the window", ->
      onsubmitCalled = false

      @cy
        .window().then (win) ->
          win.onsubmit = -> onsubmitCalled = true
          # $(win).on "submit", -> done()
        .get("form:first").submit().then ->
          expect(onsubmitCalled).to.be.true

    it "does not submit the form action is prevented default", (done) ->
      @cy.$$("form:first").parent().on "submit", (e) ->
        e.preventDefault()

      @cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            done("submit event should not submit the form!")

            return undefined
        .get("form:first").submit().then -> done()

    it "does not submit the form action returned false", (done) ->
      @cy.$$("form:first").parent().on "submit", (e) ->
        return false

      @cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            done("submit event should not submit the form!")

            return undefined
        .get("form:first").submit().then -> done()

    it "actually submits the form!", ->
      beforeunload = false

      @cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            beforeunload = true

            return undefined
        .get("form:first").submit().then ->
          expect(beforeunload).to.be.true

    ## if we removed our submit handler this would fail!
    it "does not resolve the submit command because submit event is captured setting isReady to false", ->
      ## we must rely on isReady already being pending here
      ## because the submit method does not trigger beforeunload
      ## synchronously.

      @cy.on "command:returned:value", (cmd, ret) =>
        if cmd.get("name") is "submit"
          ## expect our isReady to be pending
          expect(@cy.prop("ready").promise.isPending()).to.be.true

      @cy.get("form:first").submit()

    it "delays 50ms before resolving", (done) ->
      waited = false

      @cy.$$("form:first").on "submit", (e) =>
        _.delay ->
          waited = true
        , 50

        @cy.on "invoke:end", ->
          expect(waited).to.be.true
          done()

      @cy.get("form:first").submit()

    it "increases the timeout delta", (done) ->
      prevTimeout = @test.timeout()

      @cy.on "invoke:end", (cmd) =>
        if cmd.get("name") is "submit"
          expect(@test.timeout()).to.eq 50 + prevTimeout
          done()

      @cy.get("form:first").submit()

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "fail", (err) -> debugger

        @cy.$$("form:first").submit ->
          _.delay =>
            $(@).addClass("submitted")
          , 100

          return false

        @cy.get("form:first").submit().should("have.class", "submitted").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.$$("form:first").submit -> return false

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get("form:first").submit().should("have.class", "submitted")

      it "does not log an additional log on failure", (done) ->
        @cy.$$("form:first").submit -> return false

        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get("form:first").submit().should("have.class", "submitted")

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "is a child command", (done) ->
        @cy.on "fail", -> done()

        @cy.submit()

      it "throws when non dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.noop({}).submit()

      it "throws when subject isnt a form", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include ".submit() can only be called on a <form>! Your subject contains a: <input id=\"input\">"
          done()

        @cy.get("input").submit()

      it "throws when subject is not in the document", (done) ->
        submitted = 0

        form = @cy.$$("form:first").submit (e) ->
          submitted += 1
          form.remove()
          return false

        @cy.on "fail", (err) ->
          expect(submitted).to.eq 1
          expect(err.message).to.include "cy.submit() failed because this element"
          done()

        @cy.get("form:first").submit().submit()

      it "throws when subject is a collection of elements", (done) ->
        forms = @cy.$$("form")

        ## make sure we have more than 1 form!
        expect(forms.length).to.be.gt(1)

        @cy.on "fail", (err) =>
          expect(err.message).to.include ".submit() can only be called on a single form! Your subject contained #{forms.length} form elements!"
          done()

        @cy.get("form").submit()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.submit()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (log) =>
          if log.get("name") is "submit"
            @log = log

      it "logs immediately before resolving", ->
        form = @cy.$$("form:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "submit"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq form.get(0)

        @cy.get("form:first").submit()

      it "provides $el", ->
        @cy.$$("form:first").submit -> return false

        @cy.get("form").first().submit().then ($form) ->
          expect(@log.get("name")).to.eq "submit"
          expect(@log.get("$el")).to.match $form

      it "snapshots before submitted", (done) ->
        @cy.$$("form:first").submit -> return false

        @cy.$$("form").first().submit =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].state).to.be.an("object")
          done()

        @cy.get("form").first().submit()

      it "snapshots after submitting", ->
        @cy.$$("form:first").submit -> return false

        @cy.get("form").first().submit().then ($form) ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].state).to.be.an("object")

      it "#onConsole", ->
        @cy.$$("form:first").submit -> return false

        @cy.get("form").first().submit().then ($form) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "submit"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
          }

  context "#focused", ->
    it "returns the activeElement", ->
      button = @cy.$$("#button")
      button.get(0).focus()

      @cy.focused().then ($focused) ->
        expect($focused.get(0)).to.eq(button.get(0))

    it "returns null if no activeElement", ->
      button = @cy.$$("#button")
      button.get(0).focus()
      button.get(0).blur()

      @cy.focused().then ($focused) ->
        expect($focused).to.be.null

    it "uses forceFocusedEl if set", ->
      input = @cy.$$("input:first")
      @cy.prop("forceFocusedEl", input.get(0))

      @cy.focused().then ($focused) ->
        expect($focused.get(0)).to.eq input.get(0)

    it "does not use forceFocusedEl if that el is not in the document", ->
      input = @cy.$$("input:first")

      @cy
        .get("input:first").focus().focused().then ->
          input.remove()
        .focused().then ($el) ->
          expect($el).to.be.null

    it "nulls forceFocusedEl if that el is not in the document", ->
      input = @cy.$$("input:first")

      @cy
        .get("input:first").focus().focused().then ->
          input.remove()
        .focused().then ($el) ->
          expect(cy.prop("forceFocusedEl")).to.be.null

    it "refuses to use blacklistFocusedEl", ->
      input = @cy.$$("input:first")
      @cy.prop("blacklistFocusedEl", input.get(0))

      @cy
        .get("input:first").focus()
        .focused().then ($focused) ->
          expect($focused).to.be.null

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(300)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, =>
          @cy.$$(":text:first").addClass("focused").focus()

        @cy.focused().should("have.class", "focused").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.focused().should("have.class", "focused")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.focused().should("have.class", "focused")

    describe ".log", ->
      beforeEach ->
        @cy.$$("input:first").get(0).focus()
        @Cypress.on "log", (@log) =>

      it "is a parent command", ->
        @cy.get("body").focused().then ->
          expect(@log.get("type")).to.eq "parent"

      it "ends immediately", ->
        @cy.focused().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.focused().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "passes in $el", ->
        @cy.get("input:first").focused().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "#onConsole", ->
        @cy.get("input:first").focused().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "focused"
            Returned: $input.get(0)
            Elements: 1
          }

      it "#onConsole with null element", ->
        @cy.focused().blur().focused().then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "focused"
            Returned: "--nothing--"
            Elements: 0
          }

  context "#focus", ->
    it "sends a focus event", (done) ->
      @cy.$$("#focus input").focus -> done()

      @cy.get("#focus input").focus()

    it "bubbles focusin event", (done) ->
      @cy.$$("#focus").focusin -> done()

      @cy.get("#focus input").focus()

    it "manually blurs focused subject as a fallback", (done) ->
      @cy.$$("input:first").blur -> done()

      @cy
        .get("input:first").focus()
        .get("#focus input").focus()

    it "sets forceFocusedEl", ->
      input = @cy.$$("#focus input")

      @cy
        .get("#focus input").focus()
        .focused().then ($focused) ->
          expect($focused.get(0)).to.eq(input.get(0))

          ## make sure we have either set the property
          ## or havent
          if document.hasFocus()
            expect(@cy.prop("forceFocusedEl")).not.to.be.ok
          else
            expect(@cy.prop("forceFocusedEl")).to.eq(input.get(0))

    it "matches @cy.focused()", ->
      button = @cy.$$("#button")

      @cy.get("#button").focus().focused().then ($focused) ->
        expect($focused.get(0)).to.eq button.get(0)

    it "returns the original subject", ->
      button = @cy.$$("#button")

      @cy.get("#button").focus().then ($button) ->
        expect($button).to.match button

    it "causes first focused element to receive blur", (done) ->
      @cy.$$("input:first").blur ->
        console.log "first blurred"
        done()

      @cy
        .get("input:first").focus()
        .get("input:last").focus()

    it "can focus [contenteditable]", ->
      ce = @cy.$$("[contenteditable]:first")

      @cy
        .get("[contenteditable]:first").focus()
        .focused().then ($ce) ->
          expect($ce.get(0)).to.eq ce.get(0)

    it "delays 50ms before resolving", (done) ->
      waited = false

      @cy.$$("#focus input").on "focus", (e) =>
        _.delay ->
          waited = true
        , 50

        @cy.on "invoke:end", ->
          expect(waited).to.be.true
          done()

      @cy.get("#focus input").focus()

    it "increases the timeout delta", (done) ->
      prevTimeout = @test.timeout()

      @cy.on "invoke:end", (cmd) =>
        if cmd.get("name") is "focus"
          expect(@test.timeout()).to.eq 50 + prevTimeout
          done()

      @cy.get("#focus input").focus()

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(300)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.$$(":text:first").focus ->
          _.delay =>
            $(@).addClass("focused")
          , 100

        @cy.get(":text:first").focus().should("have.class", "focused").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get(":text:first").focus().should("have.class", "focused")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get(":text:first").focus().should("have.class", "focused")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        input = @cy.$$(":text:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "focus"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get(":text:first").focus()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get(":text:first").focus().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "passes in $el", ->
        @cy.get("input:first").focus().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "logs 2 focus event", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy
          .get("input:first").focus()
          .get("button:first").focus().then ->
            names = _(logs).map (log) -> log.get("name")
            expect(logs).to.have.length(4)
            expect(names).to.deep.eq ["get", "focus", "get", "focus"]

      it "#onConsole", ->
        @cy.get("input:first").focus().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "focus"
            "Applied To": $input.get(0)
          }

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.noop({}).focus()

        @cy.on "fail", -> done()

      it "throws when subject is not in the document", (done) ->
        focused = 0

        input = @cy.$$("input:first").focus (e) ->
          focused += 1
          input.remove()
          return false

        @cy.on "fail", (err) ->
          expect(focused).to.eq 1
          expect(err.message).to.include "cy.focus() failed because this element"
          done()

        @cy.get("input:first").focus().focus()

      it "throws when not a[href],link[href],button,input,select,textarea,[tabindex]", (done) ->
        @cy.get("form").focus()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".focus() can only be called on a valid focusable element! Your subject is a: <form id=\"by-id\">...</form>"
          done()

      it "throws when subject is a collection of elements", (done) ->
        @cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .focus()

        @cy.on "fail", (err) =>
          expect(err.message).to.include ".focus() can only be called on a single element! Your subject contained #{@num} elements!"
          done()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.focus()

      it "slurps up failed promises", (done) ->
        ctx = @

        ## we only want to test when the document
        ## isnt in focus
        return done() if document.hasFocus()

        @cy.command = _.wrap @cy.command, (orig, args...) ->
          if args[0] is "blur"
            ## force contains to return false here to
            ## simulate the element we're trying to blur
            ## isnt in the DOM
            ctx.sandbox.stub(ctx.cy, "_contains").returns(false)

          orig.apply(@, args)


        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.blur() failed because this element"
          done()

        ## we remove the first element and then
        ## focus on the 2nd.  the 2nd focus causes
        ## a blur on the 1st element, which should
        ## cause an error because its no longer in the DOM
        @cy
          .get("input:first").focus()
          .get("input:last").focus()
          .then ->
            ## sometimes hasFocus() returns false
            ## even though its really in focus
            ## in those cases, just pass
            ## i cant come up with another way
            ## to test this accurately
            done()

  context "#blur", ->
    it "should blur the originally focused element", (done) ->
      @cy.$$("#focus input").blur -> done()

      @cy.get("#focus").within ->
        @cy
          .get("input").focus()
          .get("button").focus()

    it "black lists the focused element", ->
      input = @cy.$$("#focus input")

      @cy
        .get("#focus input").focus().blur()
        .focused().then ($focused) ->
          expect($focused).to.be.null

          ## make sure we have either set the property
          ## or havent
          if document.hasFocus()
            expect(@cy.prop("blacklistFocusedEl")).not.to.be.ok
          else
            expect(@cy.prop("blacklistFocusedEl")).to.eq(input.get(0))

    it "sends a focusout event", (done) ->
      @cy.$$("#focus").focusout -> done()

      @cy.get("#focus input").focus().blur()

    it "sends a blur event", (done) ->
      # @cy.$$("input:text:first").get(0).addEventListener "blur", -> done()
      @cy.$$("input:first").blur -> done()

      @cy.get("input:first").focus().blur()

    it "returns the original subject", ->
      input = @cy.$$("input:first")

      @cy.get("input:first").focus().blur().then ($input) ->
        expect($input).to.match input

    it "can blur [contenteditable]", ->
      ce = @cy.$$("[contenteditable]:first")

      @cy
        .get("[contenteditable]:first").focus().blur().then ($ce) ->
          expect($ce.get(0)).to.eq ce.get(0)

    it "can blur input[type=time]", (done) ->
      @cy.$$("#input-types [type=time]").blur -> done()

      @cy.get("#input-types [type=time]").focus().invoke("val", "03:15:00").blur()

    it "delays 50ms before resolving", (done) ->
      waited = false

      @cy.$$("input:first").on "blur", (e) =>
        _.delay ->
          waited = true
        , 50

        @cy.on "invoke:end", ->
          expect(waited).to.be.true
          done()

      @cy.get("input:first").focus().blur()

    it "increases the timeout delta", (done) ->
      prevTimeout = @test.timeout()

      @cy.on "invoke:end", (cmd) =>
        if cmd.get("name") is "blur"
          expect(@test.timeout()).to.eq 50 + prevTimeout
          done()

      @cy.get("input:first").focus().blur()

    it "can force blurring on a non-focused element", (done) ->
      @cy.$$("input:first").blur -> done()

      @cy
        .get("input:last").focus()
        .get("input:first").blur({force: true})

    it "can force blurring when there is no focused element", (done) ->
      @cy.$$("input:first").blur -> done()

      @cy
        .focused().should("not.exist")
        .get("input:first").blur({force: true})

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(300)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "fail", (err) -> debugger

        @cy.$$(":text:first").blur ->
          _.delay =>
            $(@).addClass("blured")
          , 100

        @cy.get(":text:first").focus().blur().should("have.class", "blured").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get(":text:first").focus().blur().should("have.class", "blured")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(4)
          done()

        @cy.get(":text:first").focus().blur().should("have.class", "blured")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        input = @cy.$$(":text:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "blur"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get(":text:first").focus().blur()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get(":text:first").focus().blur().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "passes in $el", ->
        @cy.get("input:first").focus().blur().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "logs 1 blur event", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy
          .get("input:first").focus().blur().then ->
            names = _(logs).map (log) -> log.get("name")
            expect(logs).to.have.length(3)
            expect(names).to.deep.eq ["get", "focus", "blur"]

      it "logs delta options for {force: true}", ->
        @cy
          .get("input:first").blur({force: true}).then ->
            expect(@log.get("message")).to.eq("{force: true}")

      it "#onConsole", ->
        @cy.get("input:first").focus().blur().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "blur"
            "Applied To": $input.get(0)
          }

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.noop({}).blur()

      it "throws when subject is not in the document", (done) ->
        blurred = 0

        input = @cy.$$("input:first").blur (e) ->
          blurred += 1
          input.focus ->
            input.remove()
            return false
          return false

        @cy.on "fail", (err) ->
          expect(blurred).to.eq 1
          expect(err.message).to.include "cy.blur() failed because this element"
          done()

        @cy.get("input:first").focus().blur().focus().blur()

      it "throws when subject is a collection of elements", (done) ->
        @cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .blur()

        @cy.on "fail", (err) =>
          expect(err.message).to.include ".blur() can only be called on a single element! Your subject contained #{@num} elements!"
          done()

      it "throws when there isnt an activeElement", (done) ->
        @cy.get("form:first").blur()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".blur() can only be called when there is a currently focused element."
          done()

      it "throws when blur is called on a non-active element", (done) ->
        @cy
          .get("input:first").focus()
          .get("#button").blur()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".blur() can only be called on the focused element. Currently the focused element is a: <input id=\"input\">"
          done()

      it "logs delta options on error", (done) ->
        @cy.$$("button:first").click ->
          $(@).remove()

        @Cypress.on "log", (@log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("message")).to.eq("{force: true}")
          done()

        @cy
          .get("button:first").click().blur({force: true})

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.blur()

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
        console.log "input:first blurred"
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

        node = $Cypress.Utils.stringifyElement(btn)

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.dblclick() failed because this element is not visible"
          done()

        @cy.get("button").dblclick()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.dblclick()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = @cy.$$("#three-buttons button").show().last().hide()

        node = $Cypress.Utils.stringifyElement(btn)

        logs = []

        @Cypress.on "log", (@log) =>
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

        @Cypress.on "log", (log) ->
          if log.get("name") is "dblclick"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        @cy.get("button:first").dblclick()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get("button:first").dblclick().then ($button) ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "returns only the $el for the element of the subject that was dblclicked", ->
        dblclicks = []

        ## append two buttons
        button = -> $("<button class='dblclicks'>dblclick</button")
        @cy.$$("body").append(button()).append(button())

        @Cypress.on "log", (log) ->
          dblclicks.push(log) if log.get("name") is "dblclick"

        @cy.get("button.dblclicks").dblclick().then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(dblclicks.length).to.eq(2)
          expect(dblclicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 dblclick event", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log) if log.get("name") is "dblclick"

        @cy.get("button:first").dblclick().then ->
          expect(logs).to.have.length(1)

      it "#onConsole", ->
        @Cypress.on "log", (@log) =>

        @cy.get("button").first().dblclick().then ($button) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "dblclick"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
          }

  context "#click", ->
    it "receives native click event", (done) ->
      btn = @cy.$$("#button")

      coords = @cy.getCoordinates(btn)

      btn.get(0).addEventListener "click", (e) =>
        obj = _(e).pick("bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: @cy.private("window")
          clientX: coords.x - @cy.private("window").pageXOffset
          clientY: coords.y - @cy.private("window").pageYOffset
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
        @cy.private("window").removeEventListener "click", click
        done()

      @cy.private("window").addEventListener "click", click

      @cy.get("#button").click()

    it "sends native mousedown event", (done) ->
      btn = @cy.$$("#button")

      coords = @cy.getCoordinates(btn)

      btn.get(0).addEventListener "mousedown", (e) =>
        obj = _(e).pick("bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: @cy.private("window")
          clientX: coords.x - @cy.private("window").pageXOffset
          clientY: coords.y - @cy.private("window").pageYOffset
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

      btn.get(0).addEventListener "mouseup", (e) =>
        obj = _(e).pick("bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: @cy.private("window")
          clientX: coords.x - @cy.private("window").pageXOffset
          clientY: coords.y - @cy.private("window").pageYOffset
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
      button = -> $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1600px; width: 100px;'>foo</button>").appendTo @cy.$$("body")
      @cy.$$("body").append(button())

      btn = @cy.$$("#scrolledBtn")

      coords = @cy.getCoordinates(btn)

      btn.get(0).addEventListener "click", (e) =>
        obj = _(e).pick("bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj.clientX).to.eq coords.x - @cy.private("window").pageXOffset
        done()

      @cy.get("#scrolledBtn").click()

    it "records correct clientY when el scrolled", (done) ->
      button = -> $("<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1600px; width: 100px;'>foo</button>").appendTo @cy.$$("body")
      @cy.$$("body").append(button())

      btn = @cy.$$("#scrolledBtn")

      coords = @cy.getCoordinates(btn)

      btn.get(0).addEventListener "click", (e) =>
        obj = _(e).pick("bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj.clientY).to.eq coords.y - @cy.private("window").pageYOffset
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

    it "silences errors on unfocusable elements", ->
      div = @cy.$$("div:first")

      @cy.get("div:first").click({force: true})

    it "causes first focused element to receive blur", (done) ->
      @cy.$$("input:first").blur ->
        console.log "input:first blurred"
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
          console.log Date.now() - t

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
        @Cypress.on "log", (log) =>
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
          expect(@log.get("end")).to.be.true

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

        @Cypress.on "log", (log) ->
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

      it "can click center", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 30, top: btn.offset().top + 40, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("center")

      it "can click topLeft", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left, top: btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("topLeft")

      it "can click topRight", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left + 80, top: btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("topRight")

      it "can click bottomLeft", (done) ->
        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").css({height: 100, width: 100}).prependTo(@cy.$$("body"))
        span = $("<span>span</span>").css(position: "absolute", left: btn.offset().left, top: btn.offset().top + 80, padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        clicked = _.after 2, -> done()

        span.on "click", clicked
        btn.on "click", clicked

        @cy.get("#button-covered-in-span").click("bottomLeft")

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
          obj = _(e).pick("bubbles", "cancelable", "view", "which", "relatedTarget", "detail", "type")
          expect(obj).to.deep.eq {
            bubbles: false
            cancelable: false
            view: @cy.private("window")
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
          obj = _(e).pick("bubbles", "cancelable", "view", "which", "relatedTarget", "detail", "type")
          expect(obj).to.deep.eq {
            bubbles: true
            cancelable: false
            view: @cy.private("window")
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
        $(@cy.private("window")).on "focus", -> done()

        @cy.get("#nested-find").click()

      # it "events", ->
      #   btn = @cy.$$("button")
      #   win = $(@cy.private("window"))

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
          expect(err.message).to.eq "Cannot call .click() on multiple elements. You tried to click #{num} elements. Pass {multiple: true} if you want to serially click each element."
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

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.click()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = @cy.$$("#three-buttons button").show().last().hide()

        node = $Cypress.Utils.stringifyElement(btn)

        logs = []

        @Cypress.on "log", (@log) =>
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

        @Cypress.on "log", (@log) =>
          logs.push log

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

        node = @Cypress.Utils.stringifyElement(span)

        @Cypress.on "log", (@log) =>
          logs.push log

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
          expect(err.message).to.include "cy.click() failed because this element is being covered by another element"

          console = @log.attributes.onConsole()
          expect(console["Tried to Click"]).to.eq btn.get(0)
          expect(console["But its Covered By"]).to.eq span.get(0)

          done()

        @cy.get("#button-covered-in-span").click()

      it "throws when non-descendent element is covering with fixed position", (done) ->
        @cy._timeout(200)

        btn  = $("<button>button covered</button>").attr("id", "button-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span on button</span>").css(position: "fixed", left: btn.offset().left, top: btn.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(@cy.$$("body"))

        logs = []

        node = @Cypress.Utils.stringifyElement(span)

        @Cypress.on "log", (@log) =>
          logs.push log

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
          expect(err.message).to.include "cy.click() failed because this element is being covered by another element"

          console = @log.attributes.onConsole()
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
          done()

        @cy.get("#overflow-auto-container").contains("quux").click()

      it "throws when attempting to click a <select> element", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(2)
          expect(err.message).to.eq "Cannot call .click() on a <select> element. Use cy.select() command instead to change the value."
          done()

        @cy.get("select:first").click()

      it "throws when provided invalid position", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(2)
          expect(err.message).to.eq "Invalid position argument: 'foo'. Position may only be center, topLeft, topRight, bottomLeft, or bottomRight."
          done()

        @cy.get("button:first").click("foo")

      it "throws when element animation exceeds timeout", (done) ->
        @cy._timeout(100)

        clicks = 0

        p = $("<p class='slidein'>sliding in</p>")
        p.css("animation-duration", ".5s")
        p.on "click", -> clicks += 1

        @cy.on "fail", (err) ->
          expect(clicks).to.eq(0)
          expect(err.message).to.include("cy.click() could not be issued because this element is currently animating:\n")
          done()

        p.on "animationstart", =>
          @cy.get(".slidein").click({interval: 50, animationDistanceThreshold: 0})

        @cy.$$("#animation-container").append(p)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        button = @cy.$$("button:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "click"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        @cy.get("button:first").click()

      it "snapshots before clicking", (done) ->
        @cy.$$("button:first").click =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].state).to.be.an("object")
          done()

        @cy.get("button:first").click()

      it "snapshots after clicking", ->
        @cy.get("button:first").click().then ($button) ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].state).to.be.an("object")

      it "returns only the $el for the element of the subject that was clicked", ->
        clicks = []

        ## append two buttons
        button = -> $("<button class='clicks'>click</button>")
        @cy.$$("body").append(button()).append(button())

        @Cypress.on "log", (log) ->
          clicks.push(log) if log.get("name") is "click"

        @cy.get("button.clicks").click({multiple: true}).then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(clicks.length).to.eq(2)
          expect(clicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 click event", ->
        logs = []

        @Cypress.on "log", (log) ->
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

        @Cypress.on "log", (log) ->
          logs.push(log) if log.get("name") is "click"

        @cy.get("button").invoke("slice", 0, 2).click({multiple: true}).then ->
          _.each logs, (log) ->
            expect(log.get("state")).to.eq("passed")
            expect(log.get("end")).to.be.true

      it "logs {multiple: true} options", ->
        @cy.get("span").invoke("slice", 0, 2).click({multiple: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{multiple: true, timeout: 1000}"
          expect(@log.attributes.onConsole().Options).to.deep.eq {multiple: true, timeout: 1000}

      it "#onConsole", ->
        @cy.get("button").first().click().then ($button) ->
          console   = @log.attributes.onConsole()
          coords    = @cy.getCoordinates($button)
          logCoords = @log.get("coords")
          expect(logCoords.x).to.be.closeTo(coords.x, 1) ## ensure we are within 1
          expect(logCoords.y).to.be.closeTo(coords.y, 1) ## ensure we are within 1
          expect(console.Command).to.eq "click"
          expect(console["Applied To"]).to.eq @log.get("$el").get(0)
          expect(console.Elements).to.eq 1
          expect(console.Coords.x).to.be.closeTo(coords.x, 1) ## ensure we are within 1
          expect(console.Coords.y).to.be.closeTo(coords.y, 1) ## ensure we are within 1

      it "#onConsole actual element clicked", ->
        btn  = $("<button>", id: "button-covered-in-span").prependTo(@cy.$$("body"))
        span = $("<span>span in button</span>").css(padding: 5, display: "inline-block", backgroundColor: "yellow").appendTo(btn)

        @cy.get("#button-covered-in-span").click().then ->
          expect(@log.attributes.onConsole()["Actual Element Clicked"]).to.eq span.get(0)

      it "#onConsole groups MouseDown", ->
        @cy.$$("input:first").mousedown -> return false

        @cy.get("input:first").click().then ->
          expect(@log.attributes.onConsole().groups()).to.deep.eq [
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

      it "#onConsole groups MouseUp", ->
        @cy.$$("input:first").mouseup -> return false

        @cy.get("input:first").click().then ->
          expect(@log.attributes.onConsole().groups()).to.deep.eq [
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

      it "#onConsole groups Click", ->
        @cy.$$("input:first").click -> return false

        @cy.get("input:first").click().then ->
          expect(@log.attributes.onConsole().groups()).to.deep.eq [
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

      it "logs deltaOptions", ->
        @cy.get("button:first").click({force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(@log.attributes.onConsole().Options).to.deep.eq {force: true, timeout: 1000}
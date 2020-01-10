$ = Cypress.$.bind(Cypress)
_ = Cypress._
Promise = Cypress.Promise

describe "src/cy/commands/actions/check", ->
  before ->
    cy
      .visit("/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#check", ->
    it "does not change the subject", ->
      inputs = $("[name=colors]")

      cy.get("[name=colors]").check().then ($inputs) ->
        expect($inputs.length).to.eq(3)
        expect($inputs.toArray()).to.deep.eq(inputs.toArray())

    it "changes the subject if specific value passed to check", ->
      checkboxes = $("[name=colors]")

      cy.get("[name=colors]").check(["blue", "red"]).then ($chk) ->
        expect($chk.length).to.eq(2)

        blue = checkboxes.filter("[value=blue]")
        red  = checkboxes.filter("[value=red]")

        expect($chk.get(0)).to.eq(blue.get(0))
        expect($chk.get(1)).to.eq(red.get(0))

    it "filters out values which were not found", ->
      checkboxes = $("[name=colors]")

      cy.get("[name=colors]").check(["blue", "purple"]).then ($chk) ->
        expect($chk.length).to.eq(1)

        blue = checkboxes.filter("[value=blue]")

        expect($chk.get(0)).to.eq(blue.get(0))

    it "changes the subject when matching values even if noop", ->
      checked = $("<input type='checkbox' name='colors' value='blue' checked>")
      $("[name=colors]").parent().append(checked)

      checkboxes = $("[name=colors]")

      cy.get("[name=colors]").check("blue").then ($chk) ->
        expect($chk.length).to.eq(2)

        blue = checkboxes.filter("[value=blue]")

        expect($chk.get(0)).to.eq(blue.get(0))
        expect($chk.get(1)).to.eq(blue.get(1))

    it "checks a checkbox", ->
      cy.get(":checkbox[name='colors'][value='blue']").check().then ($checkbox) ->
        expect($checkbox).to.be.checked

    it "checks a radio", ->
      cy.get(":radio[name='gender'][value='male']").check().then ($radio) ->
        expect($radio).to.be.checked

    it "is a noop if already checked", ->
      checkbox = ":checkbox[name='colors'][value='blue']"

      $(checkbox).prop("checked", true)

      $(checkbox).change ->
        done("should not fire change event")

      cy.get(checkbox).check()
    
    ## readonly should only be limited to inputs, not checkboxes
    it "can check readonly checkboxes", ->
      cy.get('#readonly-checkbox').check().then ($checkbox) ->
        expect($checkbox).to.be.checked

    it "does not require visibility with force: true", ->
      checkbox = ":checkbox[name='birds']"
      $(checkbox).last().hide()

      cy.get(checkbox).check({force: true}).then ($checkbox) ->
        expect($checkbox).to.be.checked

    it "can check a collection", ->
      cy.get("[name=colors]").check().then ($inputs) ->
        $inputs.each (i, el) ->
          expect($(el)).to.be.checked

    it "can check a specific value from a collection", ->
      cy.get("[name=colors]").check("blue").then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 1
        expect($inputs.filter("[value=blue]")).to.be.checked

    it "can check multiple values from a collection", ->
      cy.get("[name=colors]").check(["blue", "green"]).then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 2
        expect($inputs.filter("[value=blue],[value=green]")).to.be.checked

    it "can forcibly click even when being covered by another element", ->
      checkbox = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prependTo($("body"))
      span = $("<span>span on checkbox</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo($("body"))

      clicked = false

      checkbox.on "click", ->
        clicked = true

      cy.get("#checkbox-covered-in-span").check({force: true}).then ->
        expect(clicked).to.be.true

    it "passes timeout and interval down to click", (done) ->
      checkbox  = $("<input type='checkbox' />")
      .attr("id", "checkbox-covered-in-span")
      .prependTo($("body"))

      span = $("<span>span on checkbox</span>")
      .css({
        position: "absolute",
        left: checkbox.offset().left,
        top: checkbox.offset().top,
        padding: 5,
        display: "inline-block",
        backgroundColor: "yellow"
      })
      .prependTo($("body"))

      cy.on "command:retry", _.once (options) ->
        expect(options.timeout).to.eq 1000
        expect(options.interval).to.eq 60
        done()

      cy.get("#checkbox-covered-in-span").check({timeout: 1000, interval: 60})

    it "waits until element is no longer disabled", ->
      chk = $(":checkbox:first").prop("disabled", true)

      retried = false
      clicks = 0

      chk.on "click", ->
        clicks += 1

      cy.on "command:retry", _.after 3, ->
        chk.prop("disabled", false)
        retried = true

      cy.get(":checkbox:first").check().then ->
        expect(clicks).to.eq(1)
        expect(retried).to.be.true

    it "delays 50ms before resolving", ->
      cy.$$(":checkbox:first").on "change", (e) =>
        cy.spy(Promise, "delay")

      cy.get(":checkbox:first").check().then ->
        expect(Promise.delay).to.be.calledWith(50, "click")

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        $(":checkbox:first").click ->
          _.delay =>
            $(@).addClass("checked")
          , 100

        cy.get(":checkbox:first").check().should("have.class", "checked").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

      it "eventually passes the assertion on multiple :checkboxs", ->
        $(":checkbox").click ->
          _.delay =>
            $(@).addClass("checked")
          , 100

        cy.get(":checkbox").invoke("slice", 0, 2).check().should("have.class", "checked")

    describe "events", ->
      it "emits click event", (done) ->
        $("[name=colors][value=blue]").click -> done()
        cy.get("[name=colors]").check("blue")

      it "emits change event", (done) ->
        $("[name=colors][value=blue]").change -> done()
        cy.get("[name=colors]").check("blue")

      it "emits focus event", () ->
        focus = false
        $("[name=colors][value=blue]").focus -> focus = true
        cy.get("[name=colors]")
        .check("blue")
        .then -> expect(focus).to.eq true

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws when subject isnt dom", (done) ->
        cy.on "fail", (err) -> done()

        cy.noop({}).check()

      it "throws when subject is not in the document", (done) ->
        checked = 0

        checkbox = $(":checkbox:first").click (e) ->
          checked += 1
          checkbox.remove()
          return false

        cy.on "fail", (err) ->
          expect(checked).to.eq 1
          expect(err.message).to.include "cy.check() failed because this element"
          done()

        cy.get(":checkbox:first").check().check()

      it "throws when subject isnt a checkbox or radio", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.check() can only be called on :checkbox and :radio. Your subject contains a: <form id=\"by-id\">...</form>"
          done()

        ## this will find multiple forms
        cy.get("form").check()

      it "throws when any member of the subject isnt a checkbox or radio", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.check() can only be called on :checkbox and :radio. Your subject contains a: <textarea id=\"comments\"></textarea>"
          done()

        ## find a textare which should blow up
        ## the textarea is the last member of the subject
        cy.get(":checkbox,:radio,#comments").check()

      it "throws when any member of the subject isnt visible", (done) ->
        chk = $(":checkbox").first().hide()

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(chk.length + 1)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "cy.check() failed because this element is not visible"
          done()

        cy.get(":checkbox:first").check()

      it "throws when subject is disabled", (done) ->
        $(":checkbox:first").prop("disabled", true)

        cy.on "fail", (err) =>
          ## get + type logs
          expect(@logs.length).eq(2)
          expect(err.message).to.include("cy.check() failed because this element is disabled:\n")
          done()

        cy.get(":checkbox:first").check()

      it "still ensures visibility even during a noop", (done) ->
        chk = $(":checkbox")
        chk.show().last().hide()

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(chk.length + 1)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "cy.check() failed because this element is not visible"
          done()

        cy.get(":checkbox").check()

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.check()

      it "throws when input cannot be clicked", (done) ->
        checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prependTo($("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo($("body"))

        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(2)
          expect(err.message).to.include "cy.check() failed because this element"
          expect(err.message).to.include "is being covered by another element"
          done()

        cy.get("#checkbox-covered-in-span").check()

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")

          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get(":checkbox:first").check().should("have.class", "checked")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(3)
          done()

        cy.get(":checkbox:first").check().should("have.class", "checked")

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          @lastLog = log

        return null

      it "logs immediately before resolving", (done) ->
        chk = $(":checkbox:first")

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "check"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        cy.get(":checkbox:first").check()

      it "snapshots before clicking", (done) ->
        $(":checkbox:first").change =>
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[0].body).to.be.an("object")
          done()

        cy.get(":checkbox:first").check()

      it "snapshots after clicking", ->
        cy.get(":checkbox:first").check().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(lastLog.get("snapshots")[1].body).to.be.an("object")

      it "logs only 1 check event on click of 1 checkbox", ->
        logs = []
        checks = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log)
          checks.push(log) if log.get("name") is "check"

        cy.get("[name=colors][value=blue]").check().then ->
          expect(logs.length).to.eq(2)
          expect(checks).to.have.length(1)

      it "logs only 1 check event on click of 1 radio", ->
        logs = []
        radios = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log)
          radios.push(log) if log.get("name") is "check"

        cy.get("[name=gender][value=female]").check().then ->
          expect(logs.length).to.eq(2)
          expect(radios).to.have.length(1)

      it "logs only 1 check event on checkbox with 1 matching value arg", ->
        logs = []
        checks = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log)
          checks.push(log) if log.get("name") is "check"

        cy.get("[name=colors]").check("blue").then ->
          expect(logs.length).to.eq(2)
          expect(checks).to.have.length(1)

      it "logs only 1 check event on radio with 1 matching value arg", ->
        logs = []
        radios = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log)
          radios.push(log) if log.get("name") is "check"

        cy.get("[name=gender]").check("female").then ->
          expect(logs.length).to.eq(2)
          expect(radios).to.have.length(1)

      it "passes in $el", ->
        cy.get("[name=colors][value=blue]").check().then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("$el").get(0)).to.eq $input.get(0)

      it "passes in coords", ->
        cy.get("[name=colors][value=blue]").check().then ($input) ->
          lastLog = @lastLog
          { fromElWindow }= Cypress.dom.getElementCoordinatesByPosition($input)
          expect(lastLog.get("coords")).to.deep.eq(fromElWindow)

      it "ends command when checkbox is already checked", ->
        cy.get("[name=colors][value=blue]").check().check().then ->
          lastLog = @lastLog

          expect(lastLog.get("state")).eq("passed")

      it "#consoleProps", ->
        cy.get("[name=colors][value=blue]").check().then ($input) ->
          lastLog = @lastLog

          { fromElWindow }= Cypress.dom.getElementCoordinatesByPosition($input)
          console = lastLog.invoke("consoleProps")
          expect(console.Command).to.eq "check"
          expect(console["Applied To"]).to.eq lastLog.get("$el").get(0)
          expect(console.Elements).to.eq 1
          expect(console.Coords).to.deep.eq(
            _.pick(fromElWindow, "x", "y")
          )

      it "#consoleProps when checkbox is already checked", ->
        cy.get("[name=colors][value=blue]").invoke("prop", "checked", true).check().then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("coords")).to.be.undefined
          expect(lastLog.invoke("consoleProps")).to.deep.eq {
            Command: "check"
            "Applied To": lastLog.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already checked. No operation took place."
            Options: undefined
          }

      it "#consoleProps when radio is already checked", ->
        cy.get("[name=gender][value=male]").check().check().then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("coords")).to.be.undefined
          expect(lastLog.invoke("consoleProps")).to.deep.eq {
            Command: "check"
            "Applied To": lastLog.get("$el").get(0)
            Elements: 1
            Note: "This radio was already checked. No operation took place."
            Options: undefined
          }

      it "#consoleProps when checkbox with value is already checked", ->
        $("[name=colors][value=blue]").prop("checked", true)

        cy.get("[name=colors]").check("blue").then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("coords")).to.be.undefined
          expect(lastLog.invoke("consoleProps")).to.deep.eq {
            Command: "check"
            "Applied To": lastLog.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already checked. No operation took place."
            Options: undefined
          }

      it "logs deltaOptions", ->
        cy.get("[name=colors][value=blue]").check({force: true, timeout: 1000}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(lastLog.invoke("consoleProps").Options).to.deep.eq {force: true, timeout: 1000}

  context "#uncheck", ->
    it "does not change the subject", ->
      inputs = $("[name=birds]")

      cy.get("[name=birds]").uncheck().then ($inputs) ->
        expect($inputs.length).to.eq(2)
        expect($inputs.toArray()).to.deep.eq(inputs.toArray())

    it "changes the subject if specific value passed to check", ->
      checkboxes = $("[name=birds]")

      cy.get("[name=birds]").check(["cockatoo", "amazon"]).then ($chk) ->
        expect($chk.length).to.eq(2)

        cockatoo = checkboxes.filter("[value=cockatoo]")
        amazon   = checkboxes.filter("[value=amazon]")

        expect($chk.get(0)).to.eq(cockatoo.get(0))
        expect($chk.get(1)).to.eq(amazon.get(0))

    it "filters out values which were not found", ->
      checkboxes = $("[name=birds]")

      cy.get("[name=birds]").check(["cockatoo", "parrot"]).then ($chk) ->
        expect($chk.length).to.eq(1)

        cockatoo = checkboxes.filter("[value=cockatoo]")

        expect($chk.get(0)).to.eq(cockatoo.get(0))

    it "changes the subject when matching values even if noop", ->
      checked = $("<input type='checkbox' name='birds' value='cockatoo'>")
      $("[name=birds]").parent().append(checked)

      checkboxes = $("[name=birds]")

      cy.get("[name=birds]").check("cockatoo").then ($chk) ->
        expect($chk.length).to.eq(2)

        cockatoo = checkboxes.filter("[value=cockatoo]")

        expect($chk.get(0)).to.eq(cockatoo.get(0))
        expect($chk.get(1)).to.eq(cockatoo.get(1))

    it "unchecks a checkbox", ->
      cy.get("[name=birds][value=cockatoo]").uncheck().then ($checkbox) ->
        expect($checkbox).not.to.be.checked

    it "unchecks a checkbox by value", ->
      cy.get("[name=birds]").uncheck("cockatoo").then ($checkbox) ->
        expect($checkbox.filter(":checked").length).to.eq 0
        expect($checkbox.filter("[value=cockatoo]")).not.to.be.checked

    it "unchecks multiple checkboxes by values", ->
      cy.get("[name=birds]").uncheck(["cockatoo", "amazon"]).then ($checkboxes) ->
        expect($checkboxes.filter(":checked").length).to.eq 0
        expect($checkboxes.filter("[value=cockatoo],[value=amazon]")).not.to.be.checked

    it "is a noop if already unchecked", ->
      checked = false
      checkbox = "[name=birds][value=cockatoo]"

      $(checkbox).prop("checked", false).change ->
        checked = true

      cy.get(checkbox).uncheck().then ->
        expect(checked).to.be.false

    it "can forcibly click even when being covered by another element", (done) ->
      checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prop("checked", true).prependTo($("body"))
      span = $("<span>span on checkbox</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo($("body"))

      checkbox.on "click", -> done()

      cy.get("#checkbox-covered-in-span").uncheck({force: true})

    it "passes timeout and interval down to click", (done) ->
      checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prop("checked", true).prependTo($("body"))
      span = $("<span>span on checkbox</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo($("body"))

      cy.on "command:retry", (options) ->
        expect(options.timeout).to.eq 1000
        expect(options.interval).to.eq 60
        done()

      cy.get("#checkbox-covered-in-span").uncheck({timeout: 1000, interval: 60})

    it "waits until element is no longer disabled", ->
      chk = $(":checkbox:first").prop("checked", true).prop("disabled", true)

      retried = false
      clicks = 0

      chk.on "click", ->
        clicks += 1

      cy.on "command:retry", _.after 3, ->
        chk.prop("disabled", false)
        retried = true

      cy.get(":checkbox:first").uncheck().then ->
        expect(clicks).to.eq(1)
        expect(retried).to.be.true

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        $(":checkbox:first").prop("checked", true).click ->
          _.delay =>
            $(@).addClass("unchecked")
          , 100

        cy.get(":checkbox:first").uncheck().should("have.class", "unchecked").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe "events", ->
      it "emits click event", (done) ->
        $("[name=colors][value=blue]").prop("checked", true).click -> done()
        cy.get("[name=colors]").uncheck("blue")

      it "emits change event", (done) ->
        $("[name=colors][value=blue]").prop("checked", true).change -> done()
        cy.get("[name=colors]").uncheck("blue")

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws specifically on a radio", (done) ->
        cy.get(":radio").uncheck()

        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.uncheck() can only be called on :checkbox."
          done()

      it "throws if not a checkbox", (done) ->
        cy.noop({}).uncheck()

        cy.on "fail", -> done()

      it "throws when any member of the subject isnt visible", (done) ->
        ## grab the first 3 checkboxes.
        chk = $(":checkbox").slice(0, 3).show()

        cy.on "fail", (err) =>
          lastLog = @lastLog

          len  = (chk.length * 2) + 6
          expect(@logs.length).to.eq(len)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "cy.uncheck() failed because this element is not visible"
          done()

        cy
          .get(":checkbox").invoke("slice", 0, 3).check().last().invoke("hide")
          .get(":checkbox").invoke("slice", 0, 3).uncheck()

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.uncheck()

      it "throws when subject is not in the document", (done) ->
        unchecked = 0

        checkbox = $(":checkbox:first").prop("checked", true).click (e) ->
          unchecked += 1
          checkbox.prop("checked", true)
          checkbox.remove()
          return false

        cy.on "fail", (err) ->
          expect(unchecked).to.eq 1
          expect(err.message).to.include "cy.uncheck() failed because this element"
          done()

        cy.get(":checkbox:first").uncheck().uncheck()

      it "throws when input cannot be clicked", (done) ->
        checkbox  = $("<input type='checkbox' />").attr("id", "checkbox-covered-in-span").prop("checked", true).prependTo($("body"))
        span = $("<span>span on button</span>").css(position: "absolute", left: checkbox.offset().left, top: checkbox.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo($("body"))

        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(2)
          expect(err.message).to.include "cy.uncheck() failed because this element"
          expect(err.message).to.include "is being covered by another element"
          done()

        cy.get("#checkbox-covered-in-span").uncheck()

      it "throws when subject is disabled", (done) ->
        $(":checkbox:first").prop("checked", true).prop("disabled", true)

        cy.on "fail", (err) =>
          ## get + type logs
          expect(@logs.length).eq(2)
          expect(err.message).to.include("cy.uncheck() failed because this element is disabled:\n")
          done()

        cy.get(":checkbox:first").uncheck()

      it "eventually passes the assertion on multiple :checkboxs", ->
        $(":checkbox").prop("checked", true).click ->
          _.delay =>
            $(@).addClass("unchecked")
          , 100

        cy.get(":checkbox").invoke("slice", 0, 2).uncheck().should("have.class", "unchecked")

      it "eventually fails the assertion", (done) ->
        $(":checkbox:first").prop("checked", true)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get(":checkbox:first").uncheck().should("have.class", "unchecked")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(3)
          done()

        cy.get(":checkbox:first").uncheck().should("have.class", "unchecked")

    describe ".log", ->
      beforeEach ->
        $("[name=colors][value=blue]").prop("checked", true)

        cy.on "log:added", (attrs, log) =>
          @lastLog = log

        return null

      it "logs immediately before resolving", (done) ->
        chk = $(":checkbox:first")

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "uncheck"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        cy.get(":checkbox:first").check().uncheck()

      it "snapshots before unchecking", (done) ->
        $(":checkbox:first").change =>
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[0].body).to.be.an("object")
          done()

        cy.get(":checkbox:first").invoke("prop", "checked", true).uncheck()

      it "snapshots after unchecking", ->
        cy.get(":checkbox:first").invoke("prop", "checked", true).uncheck().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(lastLog.get("snapshots")[1].body).to.be.an("object")

      it "logs only 1 uncheck event", ->
        logs = []
        unchecks = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log)
          unchecks.push(log) if log.get("name") is "uncheck"

        cy.get("[name=colors][value=blue]").uncheck().then ->
          expect(logs.length).to.eq(2)
          expect(unchecks).to.have.length(1)

      it "logs only 1 uncheck event on uncheck with 1 matching value arg", ->
        logs = []
        unchecks = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log)
          unchecks.push(log) if log.get("name") is "uncheck"

        cy.get("[name=colors]").uncheck("blue").then ->
          expect(logs.length).to.eq(2)
          expect(unchecks).to.have.length(1)

      it "passes in $el", ->
        cy.get("[name=colors][value=blue]").uncheck().then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("$el").get(0)).to.eq $input.get(0)

      it "ends command when checkbox is already unchecked", ->
        cy.get("[name=colors][value=blue]").invoke("prop", "checked", false).uncheck().then ->
          lastLog = @lastLog

          expect(lastLog.get("state")).eq("passed")

      it "#consoleProps", ->
        cy.get("[name=colors][value=blue]").uncheck().then ($input) ->
          lastLog = @lastLog

          { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($input)
          console = lastLog.invoke("consoleProps")
          expect(console.Command).to.eq "uncheck"
          expect(console["Applied To"]).to.eq lastLog.get("$el").get(0)
          expect(console.Elements).to.eq(1)
          expect(console.Coords).to.deep.eq(
            _.pick(fromElWindow, "x", "y")
          )

      it "#consoleProps when checkbox is already unchecked", ->
        cy.get("[name=colors][value=blue]").invoke("prop", "checked", false).uncheck().then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("coords")).to.be.undefined
          expect(lastLog.invoke("consoleProps")).to.deep.eq {
            Command: "uncheck"
            "Applied To": lastLog.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already unchecked. No operation took place."
            Options: undefined
          }

      it "#consoleProps when checkbox with value is already unchecked", ->
        cy.get("[name=colors][value=blue]").invoke("prop", "checked", false)
        cy.get("[name=colors]").uncheck("blue").then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("coords")).to.be.undefined
          expect(lastLog.invoke("consoleProps")).to.deep.eq {
            Command: "uncheck"
            "Applied To": lastLog.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already unchecked. No operation took place."
            Options: undefined
          }

      it "logs deltaOptions", ->
        cy.get("[name=colors][value=blue]").check().uncheck({force: true, timeout: 1000}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(lastLog.invoke("consoleProps").Options).to.deep.eq {force: true, timeout: 1000}

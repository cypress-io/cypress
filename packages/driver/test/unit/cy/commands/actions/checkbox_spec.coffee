{ $, _ } = window.testUtils

describe "$Cypress.Cy Checkbox Commands", ->
  enterCommandTestingMode()

  context "#check", ->
    it "does not change the subject", ->
      inputs = @cy.$$("[name=colors]")

      @cy.get("[name=colors]").check().then ($inputs) ->
        expect($inputs.length).to.eq(3)
        expect($inputs.toArray()).to.deep.eq(inputs.toArray())

    it "changes the subject if specific value passed to check", ->
      checkboxes = @cy.$$("[name=colors]")

      @cy.get("[name=colors]").check(["blue", "red"]).then ($chk) ->
        expect($chk.length).to.eq(2)

        blue = checkboxes.filter("[value=blue]")
        red  = checkboxes.filter("[value=red]")

        expect($chk.get(0)).to.eq(blue.get(0))
        expect($chk.get(1)).to.eq(red.get(0))

    it "filters out values which were not found", ->
      checkboxes = @cy.$$("[name=colors]")

      @cy.get("[name=colors]").check(["blue", "purple"]).then ($chk) ->
        expect($chk.length).to.eq(1)

        blue = checkboxes.filter("[value=blue]")

        expect($chk.get(0)).to.eq(blue.get(0))

    it "changes the subject when matching values even if noop", ->
      checked = $("<input type='checkbox' name='colors' value='blue' checked>")
      @cy.$$("[name=colors]").parent().append(checked)

      checkboxes = @cy.$$("[name=colors]")

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
        @Cypress.on "log", (attrs, log) =>
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
          expect(@log.get("ended")).to.be.true

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

        @Cypress.on "log", (attrs, log) ->
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
          expect(err.message).to.include "cy.check() can only be called on :checkbox and :radio. Your subject contains a: <form id=\"by-id\">...</form>"
          done()

      it "throws when any member of the subject isnt a checkbox or radio", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.check() can only be called on :checkbox and :radio. Your subject contains a: <textarea id=\"comments\"></textarea>"
          done()

        ## find a textare which should blow up
        ## the textarea is the last member of the subject
        @cy.get(":checkbox,:radio,#comments").check()

      it "throws when any member of the subject isnt visible", (done) ->
        chk = @cy.$$(":checkbox").first().hide()

        node = $Cypress.utils.stringifyElement(chk.last())

        logs = []

        @Cypress.on "log", (attrs, @log) =>
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

        @Cypress.on "log", (attrs, log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          ## get + type logs
          expect(logs.length).eq(2)
          expect(err.message).to.include("cy.check() failed because this element is disabled:\n")
          done()

        @cy.get(":checkbox:first").check()

      it "still ensures visibility even during a noop", (done) ->
        chk = @cy.$$(":checkbox")
        chk.show().last().hide()

        node = $Cypress.utils.stringifyElement(chk.last())

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(chk.length + 1)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.check() failed because this element is not visible"
          done()

        @cy.get(":checkbox").check()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
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

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(2)
          expect(err.message).to.include "cy.check() failed because this element"
          expect(err.message).to.include "is being covered by another element"
          done()

        @cy.get("#checkbox-covered-in-span").check()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately before resolving", (done) ->
        chk = @cy.$$(":checkbox:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "check"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        @cy.get(":checkbox:first").check()

      it "snapshots before clicking", (done) ->
        @cy.$$(":checkbox:first").change =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].body).to.be.an("object")
          done()

        @cy.get(":checkbox:first").check()

      it "snapshots after clicking", ->
        @cy.get(":checkbox:first").check().then ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].body).to.be.an("object")

      it "logs only 1 check event on click of 1 checkbox", ->
        logs = []
        checks = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)
          checks.push(log) if log.get("name") is "check"

        @cy.get("[name=colors][value=blue]").check().then ->
          expect(logs).to.have.length(2)
          expect(checks).to.have.length(1)

      it "logs only 1 check event on click of 1 radio", ->
        logs = []
        radios = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)
          radios.push(log) if log.get("name") is "check"

        @cy.get("[name=gender][value=female]").check().then ->
          expect(logs).to.have.length(2)
          expect(radios).to.have.length(1)

      it "logs only 1 check event on checkbox with 1 matching value arg", ->
        logs = []
        checks = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)
          checks.push(log) if log.get("name") is "check"

        @cy.get("[name=colors]").check("blue").then ->
          expect(logs).to.have.length(2)
          expect(checks).to.have.length(1)

      it "logs only 1 check event on radio with 1 matching value arg", ->
        logs = []
        radios = []

        @Cypress.on "log", (attrs, log) ->
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

      it "#consoleProps", ->
        @cy.get("[name=colors][value=blue]").check().then ($input) ->
          coords = @cy.getCoordinates($input)
          console = @log.attributes.consoleProps()
          expect(console.Command).to.eq "check"
          expect(console["Applied To"]).to.eq @log.get("$el").get(0)
          expect(console.Elements).to.eq 1
          expect(console.Coords).to.deep.eq coords

      it "#consoleProps when checkbox is already checked", ->
        @cy.get("[name=colors][value=blue]").invoke("prop", "checked", true).check().then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already checked. No operation took place."
            Options: undefined
          }

      it "#consoleProps when radio is already checked", ->
        @cy.get("[name=gender][value=male]").check().check().then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This radio was already checked. No operation took place."
            Options: undefined
          }

      it "#consoleProps when checkbox with value is already checked", ->
        @cy.$$("[name=colors][value=blue]").prop("checked", true)

        @cy.get("[name=colors]").check("blue").then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already checked. No operation took place."
            Options: undefined
          }

      it "logs deltaOptions", ->
        @cy.get("[name=colors][value=blue]").check({force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(@log.attributes.consoleProps().Options).to.deep.eq {force: true, timeout: 1000}

  context "#uncheck", ->
    it "does not change the subject", ->
      inputs = @cy.$$("[name=birds]")

      @cy.get("[name=birds]").uncheck().then ($inputs) ->
        expect($inputs.length).to.eq(2)
        expect($inputs.toArray()).to.deep.eq(inputs.toArray())

    it "changes the subject if specific value passed to check", ->
      checkboxes = @cy.$$("[name=birds]")

      @cy.get("[name=birds]").check(["cockatoo", "amazon"]).then ($chk) ->
        expect($chk.length).to.eq(2)

        cockatoo = checkboxes.filter("[value=cockatoo]")
        amazon   = checkboxes.filter("[value=amazon]")

        expect($chk.get(0)).to.eq(cockatoo.get(0))
        expect($chk.get(1)).to.eq(amazon.get(0))

    it "filters out values which were not found", ->
      checkboxes = @cy.$$("[name=birds]")

      @cy.get("[name=birds]").check(["cockatoo", "parrot"]).then ($chk) ->
        expect($chk.length).to.eq(1)

        cockatoo = checkboxes.filter("[value=cockatoo]")

        expect($chk.get(0)).to.eq(cockatoo.get(0))

    it "changes the subject when matching values even if noop", ->
      checked = $("<input type='checkbox' name='birds' value='cockatoo'>")
      @cy.$$("[name=birds]").parent().append(checked)

      checkboxes = @cy.$$("[name=birds]")

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
        @Cypress.on "log", (attrs, log) =>
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
          expect(@log.get("ended")).to.be.true

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

        @Cypress.on "log", (attrs, log) ->
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
          expect(err.message).to.include "cy.uncheck() can only be called on :checkbox."
          done()

      it "throws if not a checkbox", (done) ->
        @cy.noop({}).uncheck()

        @cy.on "fail", -> done()

      it "throws when any member of the subject isnt visible", (done) ->
        ## grab the first 3 checkboxes.
        chk = @cy.$$(":checkbox").slice(0, 3).show()

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          node = $Cypress.utils.stringifyElement(chk.last())
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

        @Cypress.on "log", (attrs, @log) =>
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

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(2)
          expect(err.message).to.include "cy.uncheck() failed because this element"
          expect(err.message).to.include "is being covered by another element"
          done()

        @cy.get("#checkbox-covered-in-span").uncheck()

      it "throws when subject is disabled", (done) ->
        @cy.$$(":checkbox:first").prop("checked", true).prop("disabled", true)

        logs = []

        @Cypress.on "log", (attrs, log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          ## get + type logs
          expect(logs.length).eq(2)
          expect(err.message).to.include("cy.uncheck() failed because this element is disabled:\n")
          done()

        @cy.get(":checkbox:first").uncheck()

    describe ".log", ->
      beforeEach ->
        @cy.$$("[name=colors][value=blue]").prop("checked", true)

        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately before resolving", (done) ->
        chk = @cy.$$(":checkbox:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "uncheck"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        @cy.get(":checkbox:first").check().uncheck()

      it "snapshots before unchecking", (done) ->
        @cy.$$(":checkbox:first").change =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].body).to.be.an("object")
          done()

        @cy.get(":checkbox:first").invoke("prop", "checked", true).uncheck()

      it "snapshots after unchecking", ->
        @cy.get(":checkbox:first").invoke("prop", "checked", true).uncheck().then ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].body).to.be.an("object")

      it "logs only 1 uncheck event", ->
        logs = []
        unchecks = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)
          unchecks.push(log) if log.get("name") is "uncheck"

        @cy.get("[name=colors][value=blue]").uncheck().then ->
          expect(logs).to.have.length(2)
          expect(unchecks).to.have.length(1)

      it "logs only 1 uncheck event on uncheck with 1 matching value arg", ->
        logs = []
        unchecks = []

        @Cypress.on "log", (attrs, log) ->
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

      it "#consoleProps", ->
        @cy.get("[name=colors][value=blue]").uncheck().then ($input) ->
          coords = @cy.getCoordinates($input)
          console = @log.attributes.consoleProps()
          expect(console.Command).to.eq "uncheck"
          expect(console["Applied To"]).to.eq @log.get("$el").get(0)
          expect(console.Elements).to.eq 1
          expect(console.Coords).to.deep.eq coords

      it "#consoleProps when checkbox is already unchecked", ->
        @cy.get("[name=colors][value=blue]").invoke("prop", "checked", false).uncheck().then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "uncheck"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already unchecked. No operation took place."
            Options: undefined
          }

      it "#consoleProps when checkbox with value is already unchecked", ->
        @cy.get("[name=colors][value=blue]").invoke("prop", "checked", false)
        @cy.get("[name=colors]").uncheck("blue").then ($input) ->
          expect(@log.get("coords")).to.be.undefined
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "uncheck"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
            Note: "This checkbox was already unchecked. No operation took place."
            Options: undefined
          }

      it "logs deltaOptions", ->
        @cy.get("[name=colors][value=blue]").check().uncheck({force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(@log.attributes.consoleProps().Options).to.deep.eq {force: true, timeout: 1000}

$ = Cypress.$.bind(Cypress)
_ = Cypress._

describe "src/cy/commands/actions/select", ->
  before ->
    cy
      .visit("/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#select", ->
    it "does not change the subject", ->
      select = cy.$$("select[name=maps]")

      cy.get("select[name=maps]").select("train").then ($select) ->
        expect($select).to.match select

    it "selects by value", ->
      cy.get("select[name=maps]").select("de_train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "selects by text", ->
      cy.get("select[name=maps]").select("train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "selects by trimmed text with newlines stripped", ->
      cy.get("select[name=maps]").select("italy").then ($select) ->
        expect($select).to.have.value("cs_italy")

    it "prioritizes value over text", ->
      cy.get("select[name=foods]").select("Ramen").then ($select) ->
        expect($select).to.have.value("Ramen")

    it "can select an array of values", ->
      cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    it "can handle options nested in optgroups", ->
      cy.get("select[name=starwars]").select("Jar Jar").then ($select) ->
        expect($select).to.have.value("jarjar")

    it "can handle options with same value selected by text", ->
      cy.get("select[name=startrek-same]").select("Uhura").then ($select) ->
        expect($select.val()).to.equal("same")
        expect($select.find("option:selected")).to.have.text("Uhura")
        expect($select[0].selectedIndex).to.equal(2)
        expect($select[0].selectedOptions[0]).to.eql($select.find("option:selected")[0])

    it "can handle options with some same values selected by text", ->
      cy.get("select[name=startrek-some-same]").select("Uhura").then ($select) ->
        expect($select.val()).to.equal("same")
        expect($select.find("option:selected")).to.have.text("Uhura")
        expect($select[0].selectedIndex).to.equal(2)
        expect($select[0].selectedOptions[0]).to.eql($select.find("option:selected")[0])

    it "can select an array of values", ->
      cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    it "can select an array of texts", ->
      cy.get("select[name=movies]").select(["The Human Condition", "There Will Be Blood"]).then ($select) ->
        expect($select.val()).to.deep.eq ["thc", "twbb"]

    ## readonly should only be limited to inputs, not checkboxes
    it "can select a readonly select", ->
      cy.get("select[name=hunter]").select("gon").then ($select) ->
        expect($select.val()).to.eq("gon-val")

    it "clears previous values when providing an array", ->
      ## make sure we have a previous value
      select = cy.$$("select[name=movies]").val(["2001"])
      expect(select.val()).to.deep.eq ["2001"]

      cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    it "lists the select as the focused element", ->
      select = cy.$$("#select-maps")

      cy.get("#select-maps").select("de_train").focused().then ($focused) ->
        expect($focused.get(0)).to.eq select.get(0)

    it "causes previous input to receive blur", (done) ->
      cy.$$("input:text:first").blur -> done()

      cy.get("input:text:first").type("foo")
      cy.get("#select-maps").select("de_train")

    it "can forcibly click even when being covered by another element", (done) ->
      select  = $("<select><option>foo</option></select>").attr("id", "select-covered-in-span").prependTo(cy.$$("body"))
      span = $("<span>span on select</span>").css(position: "absolute", left: select.offset().left, top: select.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(cy.$$("body"))

      select.on "click", -> done()

      cy.get("#select-covered-in-span").select("foo", {force: true})

    it "passes timeout and interval down to click", (done) ->
      select  = $("<select />").attr("id", "select-covered-in-span").prependTo(cy.$$("body"))
      span = $("<span>span on select</span>").css(position: "absolute", left: select.offset().left, top: select.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow").prependTo(cy.$$("body"))

      cy.on "command:retry", (options) ->
        expect(options.timeout).to.eq 1000
        expect(options.interval).to.eq 60
        done()

      cy.get("#select-covered-in-span").select("foobar", {timeout: 1000, interval: 60})

    it "can forcibly click even when element is invisible", (done) ->
      select = cy.$$("#select-maps").hide()

      select.click -> done()

      cy.get("#select-maps").select("de_dust2", {force: true})

    it "retries until <option> can be selected", ->
      option = cy.$$("<option>foo</option>")

      cy.on "command:retry", _.once =>
        cy.$$("#select-maps").append option

      cy.get("#select-maps").select("foo")

    it "retries until <select> is no longer disabled", ->
      select = cy.$$("select[name=disabled]")

      cy.on "command:retry", _.once =>
        select.prop("disabled", false)

      cy.get("select[name=disabled]").select("foo")

    it "retries until <options> are no longer disabled", ->
      select = cy.$$("select[name=opt-disabled]")

      cy.on "command:retry", _.once =>
        select.find("option").prop("disabled", false)

      cy.get("select[name=opt-disabled]").select("bar")

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.$$("#select-maps").change ->
          _.delay =>
            $(@).addClass("selected")
          , 100

        cy.get("#select-maps").select("de_nuke").should("have.class", "selected").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe "events", ->
      it "emits click event", (done) ->
        cy.$$("select[name=maps]").click -> done()

        cy.get("select[name=maps]").select("train")

      it "emits change event", (done) ->
        cy.$$("select[name=maps]").change -> done()

        cy.get("select[name=maps]").select("train")

      it "emits focus event", (done) ->
        cy.$$("select[name=maps]").one "focus", -> done()

        cy.get("select[name=maps]").select("train")

      it "emits input event", (done) ->
        cy.$$("select[name=maps]").one "input", -> done()

        cy.get("select[name=maps]").select("train")

      it "emits all events in the correct order", ->
        fired = []
        events = ["mousedown", "focus", "mouseup", "click", "input", "change"]

        _.each events, (event) =>
          cy.$$("select[name=maps]").one event, ->
            fired.push(event)

        cy.get("select[name=maps]").select("train").then ->
          expect(fired).to.deep.eq events

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

        cy.noop({}).select("foo")

      it "throws when subject is not in the document", (done) ->
        selected = 0

        $select = cy.$$("#select-maps").change (e) ->
          selected += 1
          $select.remove()

        cy.on "fail", (err) ->
          expect(selected).to.eq 1
          expect(err.message).to.include "`cy.select()` failed because this element"
          done()

        cy.get("#select-maps").select("de_dust2").select("de_aztec")

      it "throws when more than 1 element in the collection", (done) ->
        num = cy.$$("select").length

        cy.on "fail", (err) =>
          expect(err.message).to.include "`cy.select()` can only be called on a single `<select>`. Your subject contained #{num} elements."
          expect(err.docsUrl).to.eq("https://on.cypress.io/select")
          done()

        cy.get("select").select("foo")

      it "throws on anything other than a select", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.select()` can only be called on a `<select>`. Your subject is a: `<input id=\"input\">`"
          expect(err.docsUrl).to.eq("https://on.cypress.io/select")
          done()

        cy.get("input:first").select("foo")

      it "throws when finding duplicate values", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.select()` matched more than one `option` by value or text: `bm`"
          expect(err.docsUrl).to.eq("https://on.cypress.io/select")
          done()

        cy.get("select[name=names]").select("bm")

      it "throws when passing an array to a non multiple select", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.select()` was called with an array of arguments but does not have a `multiple` attribute set."
          expect(err.docsUrl).to.eq("https://on.cypress.io/select")
          done()

        cy.get("select[name=names]").select(["bm", "ss"])

      it "throws when the subject isnt visible", (done) ->
        select = cy.$$("#select-maps").show().hide()

        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.select()` failed because this element is not visible"
          done()

        cy.get("#select-maps").select("de_dust2")

      it "throws when value or text does not exist", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include("`cy.select()` failed because it could not find a single `<option>` with value or text matching: `foo`")
          expect(err.docsUrl).to.eq("https://on.cypress.io/select")
          done()

        cy.get("select[name=foods]").select("foo")

      it "throws when the <select> itself is disabled", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include("`cy.select()` failed because this element is currently disabled:")
          expect(err.docsUrl).to.eq("https://on.cypress.io/select")
          done()

        cy.get("select[name=disabled]").select("foo")

      it "throws when options are disabled", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include("`cy.select()` failed because this `<option>` you are trying to select is currently disabled:")
          expect(err.docsUrl).to.eq("https://on.cypress.io/select")
          done()

        cy.get("select[name=opt-disabled]").select("bar")

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get("#select-maps").select("de_nuke").should("have.class", "selected")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(3)
          done()

        cy.get("#select-maps").select("de_nuke").should("have.class", "selected")

      it "only logs once on failure", (done) ->
        cy.on "fail", (err) =>
          ## 2 logs, 1 for cy.get, 1 for cy.select
          expect(@logs.length).to.eq(2)
          done()

        cy.get("#select-maps").select("does_not_exist")

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "logs out select", ->
        cy.get("#select-maps").select("de_dust2").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq "select"

      it "passes in $el", ->
        cy.get("#select-maps").select("de_dust2").then ($select) ->
          lastLog = @lastLog

          expect(lastLog.get("$el")).to.eq $select

      it "snapshots before clicking", (done) ->
        cy.$$("#select-maps").change =>
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[0].body).to.be.an("object")
          done()

        cy.get("#select-maps").select("de_dust2").then ($select) ->

      it "snapshots after clicking", ->
        cy.get("#select-maps").select("de_dust2").then ($select) ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(lastLog.get("snapshots")[1].body).to.be.an("object")

      it "is not immediately ended", (done) ->
        cy.$$("#select-maps").click =>
          lastLog = @lastLog

          expect(lastLog.get("state")).to.eq("pending")
          done()

        cy.get("#select-maps").select("de_dust2")

      it "ends", ->
        cy.get("#select-maps").select("de_dust2").then ->
          lastLog = @lastLog

          expect(lastLog.get("state")).to.eq("passed")

      it "#consoleProps", ->
        cy.get("#select-maps").select("de_dust2").then ($select) ->
          { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($select)
          console = @lastLog.invoke("consoleProps")
          expect(console.Command).to.eq("select")
          expect(console.Selected).to.deep.eq ["de_dust2"]
          expect(console["Applied To"]).to.eq $select.get(0)
          expect(console.Coords.x).to.be.closeTo(fromElWindow.x, 10)
          expect(console.Coords.y).to.be.closeTo(fromElWindow.y, 10)

      it "logs only one select event", ->
        types = []

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "select"
            types.push(log)

        cy.get("#select-maps").select("de_dust2").then ->
          expect(@logs.length).to.eq(2)
          expect(types.length).to.eq(1)

      it "logs deltaOptions", ->
        cy.get("#select-maps").select("de_dust2", {force: true, timeout: 1000}).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(lastLog.invoke("consoleProps").Options).to.deep.eq {force: true, timeout: 1000}

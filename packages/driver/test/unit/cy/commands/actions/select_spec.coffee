{ $, _ } = window.testUtils

describe "$Cypress.Cy Select Commands", ->
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

    it "selects by trimmed text with newlines stripped", ->
      @cy.get("select[name=maps]").select("italy").then ($select) ->
        expect($select).to.have.value("cs_italy")

    it "prioritizes value over text", ->
      @cy.get("select[name=foods]").select("Ramen").then ($select) ->
        expect($select).to.have.value("Ramen")

    it "can select an array of values", ->
      @cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    it "can handle options nested in optgroups", ->
      @cy.get("select[name=starwars]").select("Jar Jar").then ($select) ->
        expect($select).to.have.value("jarjar")

    it "can handle options with same value selected by text", ->
      @cy.get("select[name=startrek-same]").select("Uhura").then ($select) ->
        expect($select.val()).to.equal("same")
        expect($select.find("option:selected")).to.have.text("Uhura")
        expect($select[0].selectedIndex).to.equal(2)
        expect($select[0].selectedOptions[0]).to.eql($select.find("option:selected")[0])

    it "can handle options with some same values selected by text", ->
      @cy.get("select[name=startrek-some-same]").select("Uhura").then ($select) ->
        expect($select.val()).to.equal("same")
        expect($select.find("option:selected")).to.have.text("Uhura")
        expect($select[0].selectedIndex).to.equal(2)
        expect($select[0].selectedOptions[0]).to.eql($select.find("option:selected")[0])

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
        @Cypress.on "log", (attrs, log) =>
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
          expect(@log.get("ended")).to.be.true

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

        @Cypress.on "log", (attrs, log) ->
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
          expect(err.message).to.include "cy.select() can only be called on a single <select>. Your subject contained #{@num} elements."
          done()

      it "throws on anything other than a select", (done) ->
        @cy.get("input:first").select("foo")

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.select() can only be called on a <select>. Your subject is a: <input id=\"input\">"
          done()

      it "throws when finding duplicate values", (done) ->
        @cy.get("select[name=names]").select("bm")

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.select() matched more than one option by value or text: bm"
          done()

      it "throws when passing an array to a non multiple select", (done) ->
        @cy.get("select[name=names]").select(["bm", "ss"])

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.select() was called with an array of arguments but does not have a 'multiple' attribute set."
          done()

      it "throws when the subject isnt visible", (done) ->
        select = @cy.$$("select:first").show().hide()

        node = $Cypress.utils.stringifyElement(select)

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

        @Cypress.on "log", (attrs, log) ->
          logs.push @log

        @cy.on "fail", (err) ->
          ## 2 logs, 1 for cy.get, 1 for cy.select
          expect(logs.length).to.eq(2)
          done()

        @cy.get("select:first").select("does_not_exist")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

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
          expect(@log.get("snapshots")[0].body).to.be.an("object")
          done()

        @cy.get("select:first").select("de_dust2").then ($select) ->

      it "snapshots after clicking", ->
        @cy.get("select:first").select("de_dust2").then ($select) ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].body).to.be.an("object")

      it "is not immediately ended", (done) ->
        @cy.$$("select:first").click =>
          expect(@log.get("state")).to.eq("pending")
          done()

        @cy.get("select:first").select("de_dust2")

      it "ends", ->
        @cy.get("select:first").select("de_dust2").then ->
          expect(@log.get("state")).to.eq("passed")

      it "#consoleProps", ->
        @cy.get("select:first").select("de_dust2").then ($select) ->
          coords = @cy.getCoordinates($select)
          console = @log.attributes.consoleProps()
          expect(console.Command).to.eq("select")
          expect(console.Selected).to.deep.eq ["de_dust2"]
          expect(console["Applied To"]).to.eq $select.get(0)
          expect(console.Coords.x).to.be.closeTo coords.x, 10
          expect(console.Coords.y).to.be.closeTo coords.y, 10

      it "logs only one select event", ->
        logs = []
        types = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)
          types.push(log) if log.get("name") is "select"

        @cy.get("select:first").select("de_dust2").then ->
          expect(logs).to.have.length(2)
          expect(types).to.have.length(1)

      it "logs deltaOptions", ->
        @cy.get("select:first").select("de_dust2", {force: true, timeout: 1000}).then ->
          expect(@log.get("message")).to.eq "{force: true, timeout: 1000}"
          expect(@log.attributes.consoleProps().Options).to.deep.eq {force: true, timeout: 1000}

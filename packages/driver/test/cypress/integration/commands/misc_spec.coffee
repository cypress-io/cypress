$ = Cypress.$.bind(Cypress)
_ = Cypress._

describe "src/cy/commands/misc", ->
  before ->
    cy
      .visit("/fixtures/jquery.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#end", ->
    it "nulls out the subject", ->
      cy.noop({}).end().then (subject) ->
        expect(subject).to.be.null

  context "#log", ->
    it "nulls out the subject", ->
      cy.wrap({}).log("foo").then (subject) ->
        expect(subject).to.be.null

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "logs immediately", (done) ->
        cy.on "log:added", (attrs, log) =>
          cy.removeAllListeners("log:added")

          expect(log.get("message")).to.eq "foo, {foo: bar}"
          expect(log.get("name")).to.eq "log"
          expect(log.get("end")).to.be.true
          done()

        cy.log("foo", {foo: "bar"}).then =>
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "consoleProps", ->
        cy.log("foobarbaz", [{}]).then ->
          expect(@lastLog.invoke("consoleProps")).to.deep.eq({
            Command: "log"
            args: [{}]
            message: "foobarbaz"
          })

  context "#wrap", ->
    beforeEach ->
      @remoteWindow = cy.state("window")

      delete @remoteWindow.$.fn.foo

    it "sets the subject to the first argument", ->
      cy.wrap({}).then (subject) ->
        expect(subject).to.deep.eq {}

    it "can wrap jquery objects and continue to chain", ->
      @remoteWindow.$.fn.foo = "foo"

      append = =>
        setTimeout =>
          $("<li class='appended'>appended</li>").appendTo cy.$$("#list")
        , 50

      cy.on "command:retry", _.after(2, _.once(append))

      cy.get("#list").then ($ul) ->

        cy
          # ensure that assertions are based on the real subject
          # and not the cy subject - therefore foo should be defined
          .wrap($ul).should("have.property", "foo")

          # then re-wrap $ul and ensure that the subject passed
          # downstream is the cypress instance
          .wrap($ul)
          .find("li.appended")
          .then ($li) ->
            ## must use explicit non cy.should
            ## else this test will always pass
            expect($li.length).to.eq(1)

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "logs immediately", (done) ->
        cy.on "log:added", (attrs, log) =>
          cy.removeAllListeners("log:added")

          expect(log.get("message")).to.eq "{}"
          expect(log.get("name")).to.eq "wrap"
          expect(log.get("end")).not.to.be.ok
          done()

        cy.wrap({}).then =>
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "stringifies DOM elements and sets $el", ->
        body = $("body")

        cy.wrap(body).then ($el) ->
          lastLog = @lastLog

          ## internally we store the real remote jquery
          ## instance instead of the cypress one
          expect(lastLog.get("$el")).not.to.eq($el)

          ## but make sure they are the same DOM object
          expect(lastLog.get("$el").get(0)).to.eq $el.get(0)
          expect(lastLog.get("message")).to.eq "<body>"

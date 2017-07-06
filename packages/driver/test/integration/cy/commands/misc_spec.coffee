{ $, _ } = window.testUtils

describe "$Cypress.Cy Misc Commands", ->
  enterCommandTestingMode()

  context "#end", ->
    it "nulls out the subject", ->
      @cy.noop({}).end().then (subject) ->
        expect(subject).to.be.null

  context "#log", ->
    it "nulls out the subject", ->
      @cy.wrap({}).log("foo").then (subject) ->
        expect(subject).to.be.null

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately", (done) ->
        @Cypress.on "log", (attrs, @log) =>
          expect(@log.get("message")).to.eq "foo, {foo: bar}"
          expect(@log.get("name")).to.eq "log"
          expect(@log.get("end")).to.be.true
          done()

        @cy.log("foo", {foo: "bar"}).then =>
          expect(@log.get("ended")).to.be.true
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "consoleProps", (done) ->
        @Cypress.on "log", (attrs, @log) =>
          expect(attrs.consoleProps).to.deep.eq({
            Command: "log"
            args: [{}]
            message: "foobarbaz"
          })
          done()

        @cy.log("foobarbaz", [{}])

  context "#wrap", ->
    beforeEach ->
      ## set the jquery path back to our
      ## remote window
      @Cypress.option "jQuery", @$iframe.prop("contentWindow").$

      @remoteWindow = @cy.privateState("window")

      delete @remoteWindow.$.fn.foo

    afterEach ->
      ## restore back to the global $
      @Cypress.option "jQuery", $

    it "sets the subject to the first argument", ->
      @cy.wrap({}).then (subject) ->
        expect(subject).to.deep.eq {}

    it "can wrap jquery objects and continue to chain", ->
      @remoteWindow.$.fn.foo = "foo"

      append = =>
        setTimeout =>
          $("<li class='appended'>appended</li>").appendTo @cy.$$("#list")
        , 50

      @cy.on "retry", _.after(2, _.once(append))

      @cy.get("#list").then ($ul) ->

        @cy
          ## ensure that assertions are based on the real subject
          ## and not the cy subject - therefore foo should be defined
          .wrap($ul).should("have.property", "foo")

          ## then re-wrap $ul and ensure that the subject passed
          ## downstream is the cypress instance
          .wrap($ul)
          .find("li.appended")
          .then ($li) ->
            ## must use explicit non cy.should
            ## else this test will always pass
            expect($li.length).to.eq(1)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately", (done) ->
        @Cypress.on "log", (attrs, @log) =>
          expect(@log.get("message")).to.eq "{}"
          expect(@log.get("name")).to.eq "wrap"
          expect(@log.get("end")).not.to.be.ok
          done()

        @cy.wrap({}).then =>
          expect(@log.get("ended")).to.be.true
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "stringifies DOM elements and sets $el", ->
        body = $("body")

        @cy.wrap(body).then ($el) ->
          ## internally we store the real remote jquery
          ## instance instead of the cypress one
          expect(@log.get("$el")).not.to.eq($el)

          ## but make sure they are the same DOM object
          expect(@log.get("$el").get(0)).to.eq $el.get(0)
          expect(@log.get("message")).to.eq "<body>"

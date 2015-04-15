describe "$Cypress.Cy Misc Commands", ->
  enterCommandTestingMode()

  context "#end", ->
    it "nulls out the subject", ->
      @cy.noop({}).end().then (subject) ->
        expect(subject).to.be.null

  context "#wrap", ->
    it "sets the subject to the first argument", ->
      @cy.wrap({}).then (subject) ->
        expect(subject).to.deep.eq {}

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs, ends, and snapshots immediately", (done) ->
        @Cypress.on "log", (log) ->
          expect(log.get("message")).to.eq "{}"
          expect(log.get("name")).to.eq "wrap"
          expect(log.get("end")).to.be.true
          expect(log.get("snapshot")).to.be.an("object")
          done()

        @cy.wrap({})

      it "stringifies DOM elements and sets $el", ->
        body = $("body")

        @cy.wrap(body).then ($el) ->
          expect(@log.get("$el")).to.eq $el
          expect(@log.get("message")).to.eq "<body>"

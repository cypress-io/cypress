describe "$Cypress.Cy Communications Commands", ->
  enterCommandTestingMode()

  context "#msg", ->
    it "proxies to #message", ->
      @Cypress.on "message", (msg, data, cb) ->
        cb(response: {foo: "bar"})

      @cy.msg("create:user").then (user) ->
        expect(user).to.deep.eq {foo: "bar"}

  context "#message", ->
    it "changes the subject to the server's response", ->
      @Cypress.on "message", (msg, data, cb) ->
        cb(response: {foo: "bar"})

      @cy.message("create:user").then (user) ->
        expect(user).to.deep.eq {foo: "bar"}

    it "does not resolve when abort happens before callback", (done) ->
      @Cypress.on "message", (msg, data, cb) =>
        _.delay ->
          cb(response: {foo: "bar"})
        , 100

        @Cypress.abort()

      @Cypress.once "abort", ->
        _.delay done, 250

      @cy.message("create:user").then ->
        done("should not have resolved here")

    it "does not error when aborting and callback errors", (done) ->
      @Cypress.on "message", (msg, data, cb) =>
        _.delay ->
          cb({__error: "could not create user."})
        , 100

        @Cypress.abort()

      @Cypress.on "fail", done

      @Cypress.once "abort", ->
        _.delay done, 250

      @cy.message("create:user").then ->
        done("should not have resolved here")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "errors if key has __error", (done) ->
        @Cypress.on "message", (msg, data, cb) ->
          cb({__error: "some err message"})

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "some err message"
          done()

        @cy.message("create:user")

      it "sets error command state", (done) ->
        @Cypress.on "log", (@log) =>

        @Cypress.on "message", (msg, data, cb) ->
          cb({__error: "some err message"})

        @cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq "failed"
          expect(@log.get("error").message).to.eq "some err message"
          expect(@log.get("error")).to.eq err
          done()

        @cy.message("foo")

      it.skip "only logs once on error", (done) ->
        logs = []

        @Cypress.on "message", (msg, data, cb) ->
          cb({__error: "some err message"})

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "some err message"
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.message("foo")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately", (done) ->
          @Cypress.on "log", (log) ->
            expect(log.pick("name", "message", "state")).to.deep.eq {
              name: "message"
              message: "create:user, {foo: bar}"
              state: "pending"
            }
            done()

          @cy.message("create:user", {foo: "bar"})

      it "logs obj once complete", ->
        @Cypress.on "message", (msg, data, cb) ->
          cb(response: {baz: "quux"})

        @cy.message("create:user").then ->
          obj = {
            state: "passed"
            name: "message"
            message: "create:user"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

      it "#onConsole", ->
        @Cypress.on "message", (msg, data, cb) ->
          cb(response: {baz: "quux"}, __logs: [1,2,3])

        @cy.message("create:user", {foo: "bar"}).then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "message"
            Message: "create:user"
            Logs: [1,2,3]
            "Data Sent": {foo: "bar"}
            "Data Returned": {baz: "quux"}
          }

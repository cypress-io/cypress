describe "$Cypress.Cy Cookie Commands", ->
  enterCommandTestingMode()

  context "test:before:hooks", ->
    it "clears cookies before each test run", ->
      get = false
      clear = false

      @Cypress.on "get:cookies", (data, cb) ->
        get = true
        expect(data).to.deep.eq({domain: "localhost"})
        cb({response: [{name: "foo"}]})

      @Cypress.on "clear:cookies", (data, cb) ->
        clear = true
        expect(data).to.deep.eq([{name: "foo", domain: "localhost"}])
        cb({response: []})

      hooks = @Cypress.invoke("test:before:hooks", {})
      Promise.resolve(hooks)
      .then ->
        expect(get).to.be.true
        expect(clear).to.be.true

    it "does not call clear:cookies when get:cookies returns empty array", ->
      get = false
      clear = false

      @Cypress.on "get:cookies", (data, cb) ->
        get = true
        expect(data).to.deep.eq({domain: "localhost"})
        cb({response: []})

      @Cypress.on "clear:cookies", (data, cb) ->
        clear = true

      hooks = @Cypress.invoke("test:before:hooks", {})
      Promise.resolve(hooks)
      .then ->
        expect(get).to.be.true
        expect(clear).to.be.false

  context "#getCookies", ->
    it "returns array of cookies", ->
      @Cypress.on "get:cookies", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost"})
        cb({response: []})

      @cy.getCookies().should("deep.eq", [])

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "logs once on error", (done) ->
        logs = []

        @Cypress.on "get:cookies", (data, cb) ->
          cb({__error: "some err message", __name: "foo", __stack: "stack"})

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "some err message"
          expect(@log.get("error").name).to.eq "foo"
          expect(@log.get("error").stack).to.eq "stack"
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.getCookies()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "get:cookies", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost"})
          cb({
            response: [
              {name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}
             ]
           })

        @Cypress.on "log", (@log) =>

      it "can turn off logging", ->
        @cy.getCookies({log: false}).then ->
          expect(@log).to.be.undefined

      it "ends immediately", ->
        @cy.getCookies().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.getCookies().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "displays name 'get cookies'", ->
        @cy.getCookies().then ->
          expect(@log.get("displayName")).to.eq("get cookies")

      it "#onConsole", ->
        @cy.getCookies().then (cookies) ->
          expect(cookies).to.deep.eq([{name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}])
          c = @log.attributes.onConsole()
          expect(c["Returned"]).to.deep.eq cookies
          expect(c["Num Cookies"]).to.eq 1

  context "#getCookie", ->
    it "returns single cookie by name", ->
      @Cypress.on "get:cookie", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost", name: "foo"})
        cb({response: {
          name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
        }})

      @cy.getCookie("foo").should("deep.eq", {
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
      })

    it "returns null when no cookie was found", ->
      @Cypress.on "get:cookie", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost", name: "foo"})
        cb({response: null})

      @cy.getCookie("foo").should("be.null")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "logs once on error", (done) ->
        logs = []

        @Cypress.on "get:cookie", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost", name: "foo"})
          cb({__error: "some err message", __name: "foo", __stack: "stack"})

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "some err message"
          expect(@log.get("error").name).to.eq "foo"
          expect(@log.get("error").stack).to.eq "stack"
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.getCookie("foo")

      it "requires a string name", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "cy.getCookie() must be passed a string argument for name."
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.getCookie(123)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "get:cookie", (data, cb) ->
          if data.name is "foo"
            expect(data).to.deep.eq({domain: "localhost", name: "foo"})
            cb({
              response: {
                name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
              }
             })

          if data.name is "bar"
            cb({response: null})

        @Cypress.on "log", (@log) =>

      it "can turn off logging", ->
        @cy.getCookie("foo", {log: false}).then ->
          expect(@log).to.be.undefined

      it "ends immediately", ->
        @cy.getCookie("foo").then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.getCookie("foo").then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "displays name 'get cookie'", ->
        @cy.getCookie("foo").then ->
          expect(@log.get("displayName")).to.eq("get cookie")

      it "#onConsole", ->
        @cy.getCookie("foo").then (cookie) ->
          expect(cookie).to.deep.eq({name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false})
          c = @log.attributes.onConsole()
          expect(c["Returned"]).to.deep.eq cookie

      it "#onConsole when no cookie found", ->
        @cy.getCookie("bar").then (cookie) ->
          expect(cookie).to.be.null
          c = @log.attributes.onConsole()
          expect(c["Returned"]).to.eq "null"
          expect(c["Note"]).to.eq("No cookie with the name: 'bar' was found.")

  context "#setCookie", ->
    beforeEach ->
      @sandbox.stub(@cy, "_addTwentyYears").returns(12345)

    it "returns set cookie", ->
      @Cypress.on "set:cookie", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345})
        cb({response: {
          name: "foo", value: "bar", domain: "localhost", path: "/", secure: false, httpOnly: false, expiry: 12345
        }})

      @cy.setCookie("foo", "bar").should("deep.eq", {
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: false, httpOnly: false, expiry: 12345
      })

    it "can change options", ->
      @Cypress.on "set:cookie", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost", name: "foo", value: "bar", path: "/foo", secure: true, httpOnly: true, expiry: 987})
        cb({response: {
          name: "foo", value: "bar", domain: "localhost", path: "/foo", secure: true, httpOnly: true, expiry: 987
        }})

      @cy.setCookie("foo", "bar", {path: "/foo", secure: true, httpOnly: true, expiry: 987}).should("deep.eq", {
        name: "foo", value: "bar", domain: "localhost", path: "/foo", secure: true, httpOnly: true, expiry: 987
      })

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "logs once on error", (done) ->
        logs = []

        @Cypress.on "set:cookie", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345})
          cb({__error: "some err message", __name: "foo", __stack: "stack"})

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "some err message"
          expect(@log.get("error").name).to.eq "foo"
          expect(@log.get("error").stack).to.eq "stack"
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.setCookie("foo", "bar")

      it "requires a string name", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "cy.setCookie() must be passed two string arguments for name and value."
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.setCookie(123)

      it "requires a string value", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "cy.setCookie() must be passed two string arguments for name and value."
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.setCookie("foo", 123)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "set:cookie", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345})
          cb({
            response: {
              name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
            }
          })

        @Cypress.on "log", (@log) =>

      it "can turn off logging", ->
        @cy.setCookie("foo", "bar", {log: false}).then ->
          expect(@log).to.be.undefined

      it "ends immediately", ->
        @cy.setCookie("foo", "bar").then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.setCookie("foo", "bar").then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "displays name 'set cookie'", ->
        @cy.setCookie("foo", "bar").then ->
          expect(@log.get("displayName")).to.eq("set cookie")

      it "#onConsole", ->
        @cy.setCookie("foo", "bar").then (cookie) ->
          expect(cookie).to.deep.eq({name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false})
          c = @log.attributes.onConsole()
          expect(c["Returned"]).to.deep.eq cookie

  context "#clearCookie", ->
    it "returns null", ->
      @Cypress.on "clear:cookie", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost", name: "foo"})
        cb({response: {
          name: "foo", value: "bar", domain: "localhost", path: "/", secure: false, httpOnly: false
        }})

      @cy.clearCookie("foo").should("be.null")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "logs once on error", (done) ->
        logs = []

        @Cypress.on "clear:cookie", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost", name: "foo"})
          cb({__error: "some err message", __name: "foo", __stack: "stack"})

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "some err message"
          expect(@log.get("error").name).to.eq "foo"
          expect(@log.get("error").stack).to.eq "stack"
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.clearCookie("foo")

      it "requires a string name", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "cy.clearCookie() must be passed a string argument for name."
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.clearCookie(123)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "clear:cookie", (data, cb) ->
          if data.name is "foo"
            expect(data).to.deep.eq({domain: "localhost", name: "foo"})
            cb({
              response: {
                name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
              }
             })

          if data.name is "bar"
            cb({response: null})

        @Cypress.on "log", (@log) =>

      it "can turn off logging", ->
        @cy.clearCookie("foo", {log: false}).then ->
          expect(@log).to.be.undefined

      it "ends immediately", ->
        @cy.clearCookie("foo").then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.clearCookie("foo").then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "displays name 'clear cookie'", ->
        @cy.clearCookie("foo").then ->
          expect(@log.get("displayName")).to.eq("clear cookie")

      it "#onConsole", ->
        @cy.clearCookie("foo").then (cookie) ->
          expect(cookie).to.be.null
          c = @log.attributes.onConsole()
          expect(c["Returned"]).to.eq("null")
          expect(c["Cleared Cookie"]).to.deep.eq {name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}

      it "#onConsole when no matching cookie was found", ->
        @cy.clearCookie("bar").then (cookie) ->
          expect(cookie).to.be.null
          c = @log.attributes.onConsole()
          expect(c["Returned"]).to.eq("null")
          expect(c["Cleared Cookie"]).to.be.undefined
          expect(c["Note"]).to.eq "No cookie with the name: 'bar' was found or removed."

  context "#clearCookies", ->
    it "returns null", ->
      @Cypress.on "get:cookies", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost"})
        cb({response: []})

      @Cypress.on "clear:cookies", (data, cb) ->
        expect(data).to.deep.eq([])
        cb({response: []})

      @cy.clearCookies().should("be.null")

    it "does not call 'clear:cookies' when no cookies were returned", ->
      called = false

      @sandbox.stub(@Cypress.Cookies, "getClearableCookies").throws("foo")

      @Cypress.on "get:cookies", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost"})
        cb({response: []})

      @Cypress.on "clear:cookies", (data, cb) ->
        called = true

      @cy.clearCookies().then ->
        expect(called).to.be.false

    it "calls 'clear:cookies' only with clearableCookies", ->
      @sandbox.stub(@Cypress.Cookies, "getClearableCookies")
      .withArgs([{name: "foo"}, {name: "bar"}])
      .returns([{name: "foo"}])

      @Cypress.on "get:cookies", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost"})
        cb({response: [
          {name: "foo"}, {name: "bar"}
        ]})

      @Cypress.on "clear:cookies", (data, cb) ->
        expect(data).to.deep.eq([
          {name: "foo", domain: "localhost"}
        ])
        cb({response: [{name: "foo"}]})

      @cy.clearCookies().should("be.null")

    it "calls 'clear:cookies' with all cookies", ->
      Cypress.Cookies.preserveOnce("bar", "baz")

      @Cypress.on "get:cookies", (data, cb) ->
        expect(data).to.deep.eq({domain: "localhost"})
        cb({response: [
          {name: "foo"}, {name: "bar"}, {name: "baz"}
        ]})

      called = false

      @Cypress.on "clear:cookies", (data, cb) ->
        if not called
          called = true
          expect(data).to.deep.eq([
            {name: "foo", domain: "localhost"}
          ])
          cb({response: [{name: "foo"}]})
        else
          expect(data).to.deep.eq([
            {name: "foo", domain: "localhost"}
            {name: "bar", domain: "localhost"}
            {name: "baz", domain: "localhost"}
          ])
          cb({response: [{name: "foo"}]})

      @cy
        .clearCookies().should("be.null")
        .clearCookies().should("be.null")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "logs once on 'get:cookies' error", (done) ->
        logs = []

        @Cypress.on "get:cookies", (data, cb) ->
          cb({__error: "some err message", __name: "foo", __stack: "stack"})

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "some err message"
          expect(@log.get("error").name).to.eq "foo"
          expect(@log.get("error").stack).to.eq "stack"
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.clearCookies()

      it "logs once on 'clear:cookies' error", (done) ->
        logs = []

        @Cypress.on "get:cookies", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost"})
          cb({response: [
            {name: "foo"}, {name: "bar"}
          ]})

        @Cypress.on "clear:cookies", (data, cb) ->
          cb({__error: "some err message", __name: "foo", __stack: "stack"})

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq "some err message"
          expect(@log.get("error").name).to.eq "foo"
          expect(@log.get("error").stack).to.eq "stack"
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.clearCookies()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "get:cookies", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost"})
          cb({
            response: [
              {name: "foo"}
             ]
           })

        @Cypress.on "clear:cookies", (data, cb) ->
          expect(data).to.deep.eq([{name: "foo", domain: "localhost"}])
          cb({response: [{
            name: "foo"
          }]})

        @Cypress.on "log", (@log) =>

      it "can turn off logging", ->
        @cy.clearCookies({log: false}).then ->
          expect(@log).to.be.undefined

      it "ends immediately", ->
        @cy.clearCookies().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.clearCookies().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "displays name 'get cookies'", ->
        @cy.clearCookies().then ->
          expect(@log.get("displayName")).to.eq("clear cookies")

      it "#onConsole", ->
        @cy.clearCookies().then (cookies) ->
          expect(cookies).to.be.null
          c = @log.attributes.onConsole()
          expect(c["Returned"]).to.eq("null")
          expect(c["Cleared Cookies"]).to.deep.eq [{name: "foo"}]
          expect(c["Num Cookies"]).to.eq 1

    describe ".log with no cookies returned", ->
      beforeEach ->
        @Cypress.on "get:cookies", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost"})
          cb({response: []})

        @Cypress.on "log", (@log) =>

      it "#onConsole", ->
        @cy.clearCookies().then (cookies) ->
          expect(cookies).to.be.null
          c = @log.attributes.onConsole()
          expect(c["Returned"]).to.eq("null")
          expect(c["Cleared Cookies"]).to.be.undefined
          expect(c["Note"]).to.eq "No cookies were found or removed."

    describe ".log when no cookies were cleared", ->
      beforeEach ->
        @Cypress.on "get:cookies", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost"})
          cb({response: [{name: "foo"}]})

        @Cypress.on "clear:cookies", (data, cb) ->
          expect(data).to.deep.eq([{name: "foo", domain: "localhost"}])
          cb({response: []})

        @Cypress.on "log", (@log) =>

      it "#onConsole", ->
        @cy.clearCookies().then (cookies) ->
          expect(cookies).to.be.null
          c = @log.attributes.onConsole()
          expect(c["Returned"]).to.eq("null")
          expect(c["Cleared Cookies"]).to.be.undefined
          expect(c["Note"]).to.eq "No cookies were found or removed."

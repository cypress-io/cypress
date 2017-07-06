{ _, Promise } = window.testUtils

describe "$Cypress.Cy Cookie Commands", ->
  enterCommandTestingMode()

  describe "cookies", ->
    beforeEach ->
      @cy._automateCookies.restore()

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

      it "does not attempt to time out", ->
        @Cypress.on "get:cookies", (data, cb) ->
          cb({response: [{name: "foo"}]})

        @Cypress.on "clear:cookies", (data, cb) ->
          cb({response: []})

        timeout = @sandbox.spy(Promise.prototype, "timeout")

        hooks = @Cypress.invoke("test:before:hooks", {})
        Promise.resolve(hooks)
        .then ->
          expect(timeout).not.to.be.called

    context "#getCookies", ->
      beforeEach ->
        @respondWith = (resp, timeout = 10) =>
          @Cypress.once "get:cookies", (data, cb) ->
            _.delay ->
              cb(resp)
            , timeout

      it "returns array of cookies", ->
        @Cypress.on "get:cookies", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost"})
          cb({response: []})

        @cy.getCookies().should("deep.eq", [])

      describe "cancellation", ->
        it "cancels promise", (done) ->
          ## respond after 50 ms
          @respondWith([], 50)

          @Cypress.on "get:cookies", =>
            @cmd = @cy.queue.first()
            @Cypress.abort()

          @cy.on "cancel", (cancelledCmd) =>
            _.delay =>
              expect(cancelledCmd).to.eq(@cmd)
              expect(@cmd.get("subject")).to.be.undefined
              done()
            , 100

          @cy.getCookies()

      describe "timeout", ->
        it "sets timeout to Cypress.config(responseTimeout)", ->
          @Cypress.config("responseTimeout", 2500)

          @respondWith([])

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.getCookies().then ->
            expect(timeout).to.be.calledWith(2500)

        it "can override timeout", ->
          @respondWith([])

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.getCookies({timeout: 1000}).then ->
            expect(timeout).to.be.calledWith(1000)

        it "clears the current timeout and restores after success", ->
          @respondWith([])

          @cy._timeout(100)

          calledTimeout = false
          _clearTimeout = @sandbox.spy(@cy, "_clearTimeout")

          @Cypress.on "get:cookies", =>
            calledTimeout = true
            expect(_clearTimeout).to.be.calledOnce

          @cy.getCookies().then ->
            expect(calledTimeout).to.be.true
            ## restores the timeout afterwards
            expect(@cy._timeout()).to.eq(100)

      describe "errors", ->
        beforeEach ->
          @allowErrors()

        it "logs once on error", (done) ->
          logs = []

          @Cypress.on "get:cookies", (data, cb) ->
            cb({__error: "some err message", __name: "foo", __stack: "stack"})

          @Cypress.on "log", (attrs, @log) =>
            logs.push @log

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(@log.get("error").message).to.eq "some err message"
            expect(@log.get("error").name).to.eq "foo"
            expect(@log.get("error").stack).to.eq "stack"
            expect(@log.get("error")).to.eq(err)
            done()

          @cy.getCookies()

        it "throws after timing out", (done) ->
          @respondWith([], 1000)

          logs = []

          @Cypress.on "log", (attrs, @log) =>
            logs.push(@log)

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(@log.get("error")).to.eq(err)
            expect(@log.get("state")).to.eq("failed")
            expect(@log.get("name")).to.eq("getCookies")
            expect(@log.get("message")).to.eq("")
            expect(err.message).to.eq("cy.getCookies() timed out waiting '50ms' to complete.")
            done()

          @cy.getCookies({timeout: 50})

      describe ".log", ->
        beforeEach ->
          @Cypress.on "get:cookies", (data, cb) ->
            expect(data).to.deep.eq({domain: "localhost"})
            cb({
              response: [
                {name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}
               ]
             })

          @Cypress.on "log", (attrs, @log) =>

        it "can turn off logging", ->
          @cy.getCookies({log: false}).then ->
            expect(@log).to.be.undefined

        it "ends immediately", ->
          @cy.getCookies().then ->
            expect(@log.get("ended")).to.be.true
            expect(@log.get("state")).to.eq("passed")

        it "snapshots immediately", ->
          @cy.getCookies().then ->
            expect(@log.get("snapshots").length).to.eq(1)
            expect(@log.get("snapshots")[0]).to.be.an("object")

        it "displays name 'get cookies'", ->
          @cy.getCookies().then ->
            expect(@log.get("displayName")).to.eq("get cookies")

        it "#consoleProps", ->
          @cy.getCookies().then (cookies) ->
            expect(cookies).to.deep.eq([{name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}])
            c = @log.attributes.consoleProps()
            expect(c["Yielded"]).to.deep.eq cookies
            expect(c["Num Cookies"]).to.eq 1

    context "#getCookie", ->
      beforeEach ->
        @respondWith = (resp, timeout = 10) =>
          @Cypress.once "get:cookie", (data, cb) ->
            _.delay ->
              cb(resp)
            , timeout

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

      describe "timeout", ->
        it "sets timeout to Cypress.config(responseTimeout)", ->
          @Cypress.config("responseTimeout", 2500)

          @respondWith([])

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.getCookie("foo").then ->
            expect(timeout).to.be.calledWith(2500)

        it "can override timeout", ->
          @respondWith([])

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.getCookie("foo", {timeout: 1000}).then ->
            expect(timeout).to.be.calledWith(1000)

        it "clears the current timeout and restores after success", ->
          @respondWith([])

          @cy._timeout(100)

          calledTimeout = false
          _clearTimeout = @sandbox.spy(@cy, "_clearTimeout")

          @Cypress.on "get:cookie", =>
            calledTimeout = true
            expect(_clearTimeout).to.be.calledOnce

          @cy.getCookie("foo").then ->
            expect(calledTimeout).to.be.true
            ## restores the timeout afterwards
            expect(@cy._timeout()).to.eq(100)

      describe "errors", ->
        beforeEach ->
          @allowErrors()

        it "throws after timing out", (done) ->
          @respondWith({}, 1000)

          logs = []

          @Cypress.on "log", (attrs, @log) =>
            logs.push(@log)

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(@log.get("error")).to.eq(err)
            expect(@log.get("state")).to.eq("failed")
            expect(@log.get("name")).to.eq("getCookie")
            expect(@log.get("message")).to.eq("foo")
            expect(err.message).to.eq("cy.getCookie() timed out waiting '50ms' to complete.")
            done()

          @cy.getCookie("foo", {timeout: 50})

        it "logs once on error", (done) ->
          logs = []

          @Cypress.on "get:cookie", (data, cb) ->
            expect(data).to.deep.eq({domain: "localhost", name: "foo"})
            cb({__error: "some err message", __name: "foo", __stack: "stack"})

          @Cypress.on "log", (attrs, @log) =>
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

          @Cypress.on "log", (attrs, @log) =>
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

          @Cypress.on "log", (attrs, @log) =>

        it "can turn off logging", ->
          @cy.getCookie("foo", {log: false}).then ->
            expect(@log).to.be.undefined

        it "ends immediately", ->
          @cy.getCookie("foo").then ->
            expect(@log.get("ended")).to.be.true
            expect(@log.get("state")).to.eq("passed")

        it "has correct message", ->
          @cy.getCookie("foo").then ->
            expect(@log.get("message")).to.eq("foo")

        it "snapshots immediately", ->
          @cy.getCookie("foo").then ->
            expect(@log.get("snapshots").length).to.eq(1)
            expect(@log.get("snapshots")[0]).to.be.an("object")

        it "displays name 'get cookie'", ->
          @cy.getCookie("foo").then ->
            expect(@log.get("displayName")).to.eq("get cookie")

        it "#consoleProps", ->
          @cy.getCookie("foo").then (cookie) ->
            expect(cookie).to.deep.eq({name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false})
            c = @log.attributes.consoleProps()
            expect(c["Yielded"]).to.deep.eq cookie

        it "#consoleProps when no cookie found", ->
          @cy.getCookie("bar").then (cookie) ->
            expect(cookie).to.be.null
            c = @log.attributes.consoleProps()
            expect(c["Yielded"]).to.eq "null"
            expect(c["Note"]).to.eq("No cookie with the name: 'bar' was found.")

    context "#setCookie", ->
      beforeEach ->
        @sandbox.stub(@cy, "_addTwentyYears").returns(12345)

        @respondWith = (resp, timeout = 10) =>
          @Cypress.once "set:cookie", (data, cb) ->
            _.delay ->
              cb(resp)
            , timeout

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
          expect(data).to.deep.eq({domain: "brian.dev.local", name: "foo", value: "bar", path: "/foo", secure: true, httpOnly: true, expiry: 987})
          cb({response: {
            name: "foo", value: "bar", domain: "brian.dev.local", path: "/foo", secure: true, httpOnly: true, expiry: 987
          }})

        @cy.setCookie("foo", "bar", {domain: "brian.dev.local", path: "/foo", secure: true, httpOnly: true, expiry: 987}).should("deep.eq", {
          name: "foo", value: "bar", domain: "brian.dev.local", path: "/foo", secure: true, httpOnly: true, expiry: 987
        })

      describe "timeout", ->
        it "sets timeout to Cypress.config(responseTimeout)", ->
          @Cypress.config("responseTimeout", 2500)

          @respondWith([])

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.setCookie("foo", "bar").then ->
            expect(timeout).to.be.calledWith(2500)

        it "can override timeout", ->
          @respondWith([])

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.setCookie("foo", "bar", {timeout: 1000}).then ->
            expect(timeout).to.be.calledWith(1000)

        it "clears the current timeout and restores after success", ->
          @respondWith([])

          @cy._timeout(100)

          calledTimeout = false
          _clearTimeout = @sandbox.spy(@cy, "_clearTimeout")

          @Cypress.on "set:cookie", =>
            calledTimeout = true
            expect(_clearTimeout).to.be.calledOnce

          @cy.setCookie("foo", "bar").then ->
            expect(calledTimeout).to.be.true
            ## restores the timeout afterwards
            expect(@cy._timeout()).to.eq(100)

      describe "errors", ->
        beforeEach ->
          @allowErrors()

        it "throws after timing out", (done) ->
          @respondWith({}, 1000)

          logs = []

          @Cypress.on "log", (attrs, @log) =>
            logs.push(@log)

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(@log.get("error")).to.eq(err)
            expect(@log.get("state")).to.eq("failed")
            expect(@log.get("name")).to.eq("setCookie")
            expect(@log.get("message")).to.eq("foo, bar")
            expect(err.message).to.eq("cy.setCookie() timed out waiting '50ms' to complete.")
            done()

          @cy.setCookie("foo", "bar", {timeout: 50})

        it "logs once on error", (done) ->
          logs = []

          @Cypress.on "set:cookie", (data, cb) ->
            expect(data).to.deep.eq({domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345})
            cb({__error: "some err message", __name: "foo", __stack: "stack"})

          @Cypress.on "log", (attrs, @log) =>
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

          @Cypress.on "log", (attrs, @log) =>
            logs.push @log

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(@log.get("error").message).to.eq "cy.setCookie() must be passed two string arguments for name and value."
            expect(@log.get("error")).to.eq(err)
            done()

          @cy.setCookie(123)

        it "requires a string value", (done) ->
          logs = []

          @Cypress.on "log", (attrs, @log) =>
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

          @Cypress.on "log", (attrs, @log) =>

        it "can turn off logging", ->
          @cy.setCookie("foo", "bar", {log: false}).then ->
            expect(@log).to.be.undefined

        it "ends immediately", ->
          @cy.setCookie("foo", "bar").then ->
            expect(@log.get("ended")).to.be.true
            expect(@log.get("state")).to.eq("passed")

        it "snapshots immediately", ->
          @cy.setCookie("foo", "bar").then ->
            expect(@log.get("snapshots").length).to.eq(1)
            expect(@log.get("snapshots")[0]).to.be.an("object")

        it "displays name 'set cookie'", ->
          @cy.setCookie("foo", "bar").then ->
            expect(@log.get("displayName")).to.eq("set cookie")

        it "#consoleProps", ->
          @cy.setCookie("foo", "bar").then (cookie) ->
            expect(cookie).to.deep.eq({name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false})
            c = @log.attributes.consoleProps()
            expect(c["Yielded"]).to.deep.eq cookie

    context "#clearCookie", ->
      beforeEach ->
        @respondWith = (resp, timeout = 10) =>
          @Cypress.once "clear:cookie", (data, cb) ->
            _.delay ->
              cb(resp)
            , timeout

      it "returns null", ->
        @Cypress.on "clear:cookie", (data, cb) ->
          expect(data).to.deep.eq({domain: "localhost", name: "foo"})
          cb({response: {
            name: "foo", value: "bar", domain: "localhost", path: "/", secure: false, httpOnly: false
          }})

        @cy.clearCookie("foo").should("be.null")

      describe "timeout", ->
        it "sets timeout to Cypress.config(responseTimeout)", ->
          @Cypress.config("responseTimeout", 2500)

          @respondWith({})

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.clearCookie("foo").then ->
            expect(timeout).to.be.calledWith(2500)

        it "can override timeout", ->
          @respondWith([])

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.clearCookie("foo", {timeout: 1000}).then ->
            expect(timeout).to.be.calledWith(1000)

        it "clears the current timeout and restores after success", ->
          @respondWith([])

          @cy._timeout(100)

          calledTimeout = false
          _clearTimeout = @sandbox.spy(@cy, "_clearTimeout")

          @Cypress.on "clear:cookie", =>
            calledTimeout = true
            expect(_clearTimeout).to.be.calledOnce

          @cy.clearCookie("foo").then ->
            expect(calledTimeout).to.be.true
            ## restores the timeout afterwards
            expect(@cy._timeout()).to.eq(100)

      describe "errors", ->
        beforeEach ->
          @allowErrors()

        it "throws after timing out", (done) ->
          @respondWith({}, 1000)

          logs = []

          @Cypress.on "log", (attrs, @log) =>
            logs.push(@log)

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(@log.get("error")).to.eq(err)
            expect(@log.get("state")).to.eq("failed")
            expect(@log.get("name")).to.eq("clearCookie")
            expect(@log.get("message")).to.eq("foo")
            expect(err.message).to.eq("cy.clearCookie() timed out waiting '50ms' to complete.")
            done()

          @cy.clearCookie("foo", {timeout: 50})

        it "logs once on error", (done) ->
          logs = []

          @Cypress.on "clear:cookie", (data, cb) ->
            expect(data).to.deep.eq({domain: "localhost", name: "foo"})
            cb({__error: "some err message", __name: "foo", __stack: "stack"})

          @Cypress.on "log", (attrs, @log) =>
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

          @Cypress.on "log", (attrs, @log) =>
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

          @Cypress.on "log", (attrs, @log) =>

        it "can turn off logging", ->
          @cy.clearCookie("foo", {log: false}).then ->
            expect(@log).to.be.undefined

        it "ends immediately", ->
          @cy.clearCookie("foo").then ->
            expect(@log.get("ended")).to.be.true
            expect(@log.get("state")).to.eq("passed")

        it "snapshots immediately", ->
          @cy.clearCookie("foo").then ->
            expect(@log.get("snapshots").length).to.eq(1)
            expect(@log.get("snapshots")[0]).to.be.an("object")

        it "displays name 'clear cookie'", ->
          @cy.clearCookie("foo").then ->
            expect(@log.get("displayName")).to.eq("clear cookie")

        it "#consoleProps", ->
          @cy.clearCookie("foo").then (cookie) ->
            expect(cookie).to.be.null
            c = @log.attributes.consoleProps()
            expect(c["Yielded"]).to.eq("null")
            expect(c["Cleared Cookie"]).to.deep.eq {name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}

        it "#consoleProps when no matching cookie was found", ->
          @cy.clearCookie("bar").then (cookie) ->
            expect(cookie).to.be.null
            c = @log.attributes.consoleProps()
            expect(c["Yielded"]).to.eq("null")
            expect(c["Cleared Cookie"]).to.be.undefined
            expect(c["Note"]).to.eq "No cookie with the name: 'bar' was found or removed."

    context "#clearCookies", ->
      beforeEach ->
        @respondWith = (resp, timeout = 10) =>
          @Cypress.once "get:cookies", (data, cb) ->
            _.delay ->
              cb(resp)
            , timeout

          @Cypress.once "clear:cookies", (data, cb) ->
            _.delay ->
              cb(resp)
            , timeout

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

      describe "timeout", ->
        it "sets timeout to Cypress.config(responseTimeout)", ->
          @Cypress.config("responseTimeout", 2500)

          @respondWith([])

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.clearCookies().then ->
            expect(timeout).to.be.calledWith(2500)

        it "can override timeout", ->
          @respondWith([])

          timeout = @sandbox.spy(Promise.prototype, "timeout")

          @cy.clearCookies({timeout: 1000}).then ->
            expect(timeout).to.be.calledWith(1000)

        it "clears the current timeout and restores after success", ->
          @respondWith([])

          @cy._timeout(100)

          calledTimeout = false
          _clearTimeout = @sandbox.spy(@cy, "_clearTimeout")

          @Cypress.on "clear:cookies", =>
            calledTimeout = true
            expect(_clearTimeout).to.be.calledTwice

          @cy.clearCookies().then ->
            expect(calledTimeout).to.be.true
            ## restores the timeout afterwards
            expect(@cy._timeout()).to.eq(100)

      describe "errors", ->
        beforeEach ->
          @allowErrors()

        it "throws after timing out", (done) ->
          @respondWith({}, 1000)

          logs = []

          @Cypress.on "log", (attrs, @log) =>
            logs.push(@log)

          @cy.on "fail", (err) =>
            expect(logs.length).to.eq(1)
            expect(@log.get("error")).to.eq(err)
            expect(@log.get("state")).to.eq("failed")
            expect(@log.get("name")).to.eq("clearCookies")
            expect(@log.get("message")).to.eq("")
            expect(err.message).to.eq("cy.clearCookies() timed out waiting '50ms' to complete.")
            done()

          @cy.clearCookies({timeout: 50})

        it "logs once on 'get:cookies' error", (done) ->
          logs = []

          @Cypress.on "get:cookies", (data, cb) ->
            cb({__error: "some err message", __name: "foo", __stack: "stack"})

          @Cypress.on "log", (attrs, @log) =>
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

          @Cypress.on "log", (attrs, @log) =>
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

          @Cypress.on "log", (attrs, @log) =>

        it "can turn off logging", ->
          @cy.clearCookies({log: false}).then ->
            expect(@log).to.be.undefined

        it "ends immediately", ->
          @cy.clearCookies().then ->
            expect(@log.get("ended")).to.be.true
            expect(@log.get("state")).to.eq("passed")

        it "snapshots immediately", ->
          @cy.clearCookies().then ->
            expect(@log.get("snapshots").length).to.eq(1)
            expect(@log.get("snapshots")[0]).to.be.an("object")

        it "displays name 'get cookies'", ->
          @cy.clearCookies().then ->
            expect(@log.get("displayName")).to.eq("clear cookies")

        it "#consoleProps", ->
          @cy.clearCookies().then (cookies) ->
            expect(cookies).to.be.null
            c = @log.attributes.consoleProps()
            expect(c["Yielded"]).to.eq("null")
            expect(c["Cleared Cookies"]).to.deep.eq [{name: "foo"}]
            expect(c["Num Cookies"]).to.eq 1

      describe ".log with no cookies returned", ->
        beforeEach ->
          @Cypress.on "get:cookies", (data, cb) ->
            expect(data).to.deep.eq({domain: "localhost"})
            cb({response: []})

          @Cypress.on "log", (attrs, @log) =>

        it "#consoleProps", ->
          @cy.clearCookies().then (cookies) ->
            expect(cookies).to.be.null
            c = @log.attributes.consoleProps()
            expect(c["Yielded"]).to.eq("null")
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

          @Cypress.on "log", (attrs, @log) =>

        it "#consoleProps", ->
          @cy.clearCookies().then (cookies) ->
            expect(cookies).to.be.null
            c = @log.attributes.consoleProps()
            expect(c["Yielded"]).to.eq("null")
            expect(c["Cleared Cookies"]).to.be.undefined
            expect(c["Note"]).to.eq "No cookies were found or removed."

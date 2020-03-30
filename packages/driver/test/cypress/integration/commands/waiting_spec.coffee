_ = Cypress._
Promise = Cypress.Promise

xhrGet = (win, url) ->
  xhr = new win.XMLHttpRequest
  xhr.open("GET", url)
  xhr.send()

describe "src/cy/commands/waiting", ->
  context "#wait", ->
    describe "number argument", ->
      it "passes delay onto Promise", ->
        delay = cy.spy(Promise, "delay")

        cy.wait(50).then ->
          expect(delay).to.be.calledWith(50, "wait")

      it "does not change the subject", ->
        cy
          .wrap({})
          .then (subject) ->
            @subject = subject
          .wait(10).then (subject) ->
            expect(subject).to.eq @subject

      it "increases timeout by delta", ->
        timeout = cy.spy(cy, "timeout")

        cy
        .wait(50)
        .then ->
          expect(timeout).to.be.calledWith(50, true, "wait")

    describe "function argument", ->
      describe "errors thrown", ->
        it "is deprecated", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.eq "`cy.wait(fn)` has been deprecated. Change this command to be `cy.should(fn)`."
            done()

          cy.get("body").wait ($body) ->
            expect($body).to.match("body")

    describe "alias argument", ->
      before ->
        cy.visit("/fixtures/jquery.html")

      it "waits for a route alias to have a response", ->
        response = {foo: "foo"}

        cy
          .server()
          .route("GET", /.*/, response).as("fetch")
          .window().then (win) ->
            win.$.get("/foo")
            null
          .wait("@fetch").then (xhr) ->
            expect(xhr.responseBody).to.deep.eq response

      it "waits for the route alias to have a request", ->
        cy.on "command:retry", _.once =>
          win = cy.state("window")
          win.$.get("/users")
          null

        cy
          .server({delay: 1000})
          .route(/users/, {}).as("getUsers")
          .wait("@getUsers.request").then (xhr) ->
            expect(xhr.url).to.include "/users"
            expect(xhr.response).to.be.null

      it "passes timeout option down to requestTimeout of wait", (done) ->
        retry = _.after 3, _.once =>
          cy.state("window").$.get("/foo")

        cy.on "command:retry", (options) ->
          expect(options.timeout).to.eq 900
          done()

        cy
          .server()
          .route("GET", /.*/, {}).as("fetch")
          .wait("@fetch", {timeout: 900})

      it "resets the timeout after waiting", ->
        prevTimeout = cy.timeout()

        retry = _.after 3, _.once =>
          cy.state("window").$.get("/foo")

        cy.on "command:retry", retry

        cy
          .server()
          .route("GET", /.*/, {}).as("fetch")
          .wait("@fetch").then ->
            expect(cy.timeout()).to.eq prevTimeout

      it "waits for requestTimeout", (done) ->
        Cypress.config("requestTimeout", 199)

        cy.on "command:retry", (options) ->
          expect(options.timeout).to.eq(199)
          done()

        cy
          .server()
          .route("GET", "*", {}).as("fetch")
          .wait("@fetch").then ->
            expect(cy.timeout()).to.eq 199

      it "waits for requestTimeout override", (done) ->
        cy.on "command:retry", (options) ->
          expect(options.type).to.eq("request")
          expect(options.timeout).to.eq(199)
          done()

        cy
          .server()
          .route("GET", "*", {}).as("fetch")
          .wait("@fetch", {requestTimeout: 199})

      it "waits for responseTimeout", (done) ->
        Cypress.config("responseTimeout", 299)

        cy.on "command:retry", (options) ->
          expect(options.timeout).to.eq(299)
          done()

        cy
          .server({delay: 100})
          .route("GET", "*", {}).as("fetch")
          .window().then (win) ->
            win.$.get("/foo")
            null
          .wait("@fetch")

      it "waits for responseTimeout override", (done) ->
        cy.on "command:retry", (options) ->
          expect(options.type).to.eq("response")
          expect(options.timeout).to.eq(299)
          done()

        cy
          .server({delay: 100})
          .route("GET", "*", {}).as("fetch")
          .window().then (win) ->
            win.$.get("/foo")
            null
          .wait("@fetch", {responseTimeout: 299})

      it "waits for requestTimeout and responseTimeout override", (done) ->
        retryCount = 0
        cy.on "command:retry", (options) ->
          retryCount++
          if retryCount == 1
            expect(options.type).to.eq("request")
            expect(options.timeout).to.eq(100)

            ## trigger request to move onto response timeout verification
            win = cy.state("window")
            win.$.get("/foo")
          else if retryCount == 2
            expect(options.type).to.eq("response")
            expect(options.timeout).to.eq(299)
            done()

        cy
          .server({delay: 100})
          .route("GET", "*", {}).as("fetch")
          .wait("@fetch", {requestTimeout: 100, responseTimeout: 299})

      ## https://github.com/cypress-io/cypress/issues/369
      it "does not mutate 2nd route methods when using shorthand route", ->
        cy
          .server()
          .route("POST", /foo/, {}).as("getFoo")
          .route(/bar/, {}).as("getBar")
          .window().then (win) ->
            win.$.post("/foo")
            win.$.get("/bar")
            null
          .wait("@getBar")

      describe "errors", ->
        beforeEach ->
          Cypress.config("defaultCommandTimeout", 50)

        it "throws when alias doesnt match a route", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` only accepts aliases for routes.\nThe alias: `b` did not match a route."
            expect(err.docsUrl).to.eq("https://on.cypress.io/wait")
            done()

          cy.get("body").as("b").wait("@b")

        it "throws when route is never resolved", (done) ->
          Cypress.config("requestTimeout", 100)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `fetch`. No request ever occurred."
            done()

          cy.server()
          cy.route("GET", /.*/, {}).as("fetch")
          cy.wait("@fetch")

        it "throws when alias is never requested", (done) ->
          Cypress.config("requestTimeout", 100)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `foo`. No request ever occurred."
            done()

          cy
            .server()
            .route(/foo/, {}).as("foo")
            .wait("@foo.request")

        it "throws when alias is missing '@' but matches an available alias", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: `getAny`.\nYou forgot the `@`. It should be written as: `@getAny`."
            done()

          cy
            .server()
            .route("*", {}).as("getAny")
            .wait("getAny").then ->

        it "throws when 2nd alias doesnt match any registered alias", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.eq "`cy.wait()` could not find a registered alias for: `@bar`.\nAvailable aliases are: `foo`."
            done()

          cy
            .server()
            .route(/foo/, {}).as("foo")
            .window().then (win) ->
              win.$.get("/foo")
              null
            .wait(["@foo", "@bar"])

        it "throws when 2nd alias is missing '@' but matches an available alias", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: `bar`.\nYou forgot the `@`. It should be written as: `@bar`."
            done()

          cy
            .server()
            .route(/foo/, {}).as("foo")
            .route(/bar/, {}).as("bar")
            .window().then (win) ->
              win.$.get("/foo")
              null
            .wait(["@foo", "bar"])

        it "throws when 2nd alias isnt a route alias", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` only accepts aliases for routes.\nThe alias: `bar` did not match a route."
            expect(err.docsUrl).to.eq("https://on.cypress.io/wait")
            done()

          cy
            .server()
            .route(/foo/, {}).as("foo")
            .get("body").as("bar")
            .window().then (win) ->
              win.$.get("/foo")
              null
            .wait(["@foo", "@bar"])

        it "throws whenever an alias times out", (done) ->
          Cypress.config("requestTimeout", 1000)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `1000ms` for the 1st request to the route: `foo`. No request ever occurred."
            done()

          cy.on "command:retry", (options) ->
            ## force foo to time out before bar
            if /foo/.test options.error
              options._runnableTimeout = 0

          cy
            .server()
            .route(/foo/, {}).as("foo")
            .route(/bar/, {}).as("bar")
            .wait(["@foo", "@bar"])

        it "throws when bar cannot resolve", (done) ->
          Cypress.config("requestTimeout", 100)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `bar`. No request ever occurred."
            done()

          cy.on "command:retry", _.once =>
            win = cy.state("window")
            win.$.get("/foo")
            null

          cy
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "throws when foo cannot resolve", (done) ->
          Cypress.config("requestTimeout", 100)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `foo`. No request ever occurred."
            done()

          cy.on "command:retry", _.once =>
            win = cy.state("window")
            win.$.get("/bar")
            null

          cy
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "does not throw another timeout error when 2nd alias is missing @", (done) ->
          Promise.onPossiblyUnhandledRejection(done)

          Cypress.config("requestTimeout", 100)

          cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: `bar`.\nYou forgot the `@`. It should be written as: `@bar`."
            done()

          cy
            .server()
            .route(/foo/, {}).as("foo")
            .route(/bar/, {}).as("bar")
            .wait(["@foo", "bar"])

        it "does not throw again when 2nd alias doesnt reference a route", (done) ->
          Promise.onPossiblyUnhandledRejection(done)

          Cypress.config("requestTimeout", 100)

          cy.on "fail", (err) ->
            expect(err.message).to.eq "`cy.wait()` only accepts aliases for routes.\nThe alias: `bar` did not match a route."
            expect(err.docsUrl).to.eq("https://on.cypress.io/wait")
            done()

          cy
            .server()
            .route(/foo/, {}).as("foo")
            .get("body").as("bar")
            .wait(["@foo", "@bar"])

        it "does not retry after 1 alias times out", (done) ->
          Promise.onPossiblyUnhandledRejection(done)

          Cypress.config("requestTimeout", 1000)

          cy.on "command:retry", (options) ->
            ## force bar to time out before foo
            if /bar/.test options.error
              options._runnableTimeout = 0

          cy.on "fail", (err) =>
            done()

          cy
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "throws waiting for the 3rd response", (done) ->
          resp = {foo: "foo"}
          response = 0

          Cypress.config("requestTimeout", 200)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `200ms` for the 3rd request to the route: `get.users`. No request ever occurred."
            done()

          cy.on "command:retry", =>
            response += 1

            ## dont send the 3rd response
            return cy.removeAllListeners("command:retry") if response is 3
            win = cy.state("window")
            win.$.get("/users", {num: response})

          cy.server()
          cy.route(/users/, resp).as("get.users")
          cy.wait(["@get.users", "@get.users", "@get.users"])

        it "throws waiting for the 2nd response", (done) ->
          resp = {foo: "foo"}
          response = 0

          Cypress.config("requestTimeout", 200)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `200ms` for the 2nd request to the route: `getUsers`. No request ever occurred."
            done()

          ## dont send the 2nd response
          cy.on "command:retry", _.once =>
            response += 1
            win = cy.state("window")
            win.$.get("/users", {num: response})

          cy
            .server()
            .route(/users/, resp).as("getUsers")
            .wait("@getUsers")
            .wait("@getUsers")

        it "throws waiting for the 2nd request", (done) ->
          resp = {foo: "foo"}
          request = 0

          Cypress.config("requestTimeout", 200)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `200ms` for the 2nd request to the route: `getUsers`. No request ever occurred."
            done()

          ## dont send the 2nd request
          cy.on "command:retry", _.once =>
            request += 1
            win = cy.state("window")
            win.$.get("/users", {num: request})

          cy
            .server()
            .route(/users/, resp).as("getUsers")
            .wait("@getUsers.request")
            .wait("@getUsers.request")

        it "throws when waiting for response to route", (done) ->
          Cypress.config("responseTimeout", 100)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `100ms` for the 1st response to the route: `response`. No response ever occurred."
            done()

          cy
            .server()
            .route("*").as("response")
            .window().then (win) ->
              win.$.get("/timeout?ms=500")
              null
            .wait("@response")

        it "throws when waiting for 2nd response to route", (done) ->
          Cypress.config("responseTimeout", 200)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `200ms` for the 2nd response to the route: `response`. No response ever occurred."
            done()

          cy
            .server()
            .route("*").as("response")
            .window().then (win) ->
              win.$.get("/timeout?ms=0")
              win.$.get("/timeout?ms=5000")
              null
            .wait(["@response", "@response"])

        it "throws when waiting for 1st response to bar", (done) ->
          Cypress.config("responseTimeout", 200)

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `200ms` for the 1st response to the route: `bar`. No response ever occurred."
            done()

          cy
            .server()
            .route("/timeout?ms=0").as("foo")
            .route("/timeout?ms=5000").as("bar")
            .window().then (win) ->
              win.$.get("/timeout?ms=0")
              win.$.get("/timeout?ms=5000")
              null
            .wait(["@foo", "@bar"])

        it "throws when waiting on the 2nd request", (done) ->
          Cypress.config("requestTimeout", 200)

          cy.on "command:retry", _.once =>
            win = cy.state("window")
            win.$.get("/users")
            null

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `200ms` for the 2nd request to the route: `getUsers`. No request ever occurred."
            done()

          cy
            .server({delay: 200})
            .route(/users/, {}).as("getUsers")
            .wait("@getUsers.request").then (xhr) ->
              expect(xhr.url).to.include "/users"
              expect(xhr.response).to.be.null
            .wait("@getUsers")

        it "throws when waiting on the 3rd request on array of aliases", (done) ->
          Cypress.config("requestTimeout", 500)
          Cypress.config("responseTimeout", 10000)

          cy.on "command:retry", _.once =>
            win = cy.state("window")
            _.defer => win.$.get("/timeout?ms=2001")
            _.defer => win.$.get("/timeout?ms=2002")

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `500ms` for the 1st request to the route: `get.three`. No request ever occurred."
            done()

          cy.server()
          cy.route("/timeout?ms=2001").as("getOne")
          cy.route("/timeout?ms=2002").as("getTwo")
          cy.route(/three/, {}).as("get.three")
          cy.wait(["@getOne", "@getTwo", "@get.three"])

        it "throws when waiting on the 3rd response on array of aliases", (done) ->
          Cypress.config("requestTimeout", 200)
          Cypress.config("responseTimeout", 1000)

          win = cy.state("window")

          cy.on "command:retry", (options) ->
            if /getThree/.test(options.error)
              ## force 3 to immediately time out
              options._runnableTimeout = 0

          cy.on "fail", (err) ->
            expect(err.message).to.include "`cy.wait()` timed out waiting `1000ms` for the 1st response to the route: `getThree`. No response ever occurred."
            done()

          cy
            .server()
            .route("/timeout?ms=1").as("getOne")
            .route("/timeout?ms=2").as("getTwo")
            .route("/timeout?ms=3000").as("getThree")
            .then ->
              win.$.get("/timeout?ms=1")
              win.$.get("/timeout?ms=2")
              win.$.get("/timeout?ms=3000")

              return null
            .wait(["@getOne", "@getTwo", "@getThree"])

        it "throws when passed multiple string arguments", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.eq "`cy.wait()` was passed invalid arguments. You cannot pass multiple strings. If you're trying to wait for multiple routes, use an array."
            expect(err.docsUrl).to.eq("https://on.cypress.io/wait")
            done()

          cy.wait("@foo", "@bar")

    describe "multiple alias arguments", ->
      before ->
        cy.visit("/fixtures/jquery.html")

      it "can wait for all requests to have a response", ->
        resp1 = {foo: "foo"}
        resp2 = {bar: "bar"}

        cy.server()
        cy.route(/users/, resp1).as("getUsers")
        cy.route(/posts/, resp2).as("get.posts")
        cy.window().then (win) ->
          win.$.get("/users")
          win.$.get("/posts")
          null
        cy.wait(["@getUsers", "@get.posts"]).spread (xhr1, xhr2) ->
          expect(xhr1.responseBody).to.deep.eq resp1
          expect(xhr2.responseBody).to.deep.eq resp2

    describe "multiple separate alias waits", ->
      before ->
        cy.visit("/fixtures/jquery.html")

      it "waits for a 3rd request before resolving", ->
        resp = {foo: "foo"}
        response = 0

        win = cy.state("window")

        cy.on "command:retry", (options) ->
          if options._retries is 1
            response += 1
            win.$.get("/users", {num: response})

        cy
          .server()
          .route(/users/, resp).as("getUsers")
          .wait("@getUsers").then (xhr) ->
            expect(xhr.url).to.include "/users?num=1"
            expect(xhr.responseBody).to.deep.eq resp
          .wait("@getUsers").then (xhr) ->
            expect(xhr.url).to.include "/users?num=2"
            expect(xhr.responseBody).to.deep.eq resp
          .wait("@getUsers").then (xhr) ->
            expect(xhr.url).to.include "/users?num=3"
            expect(xhr.responseBody).to.deep.eq resp

      ## FIXME: failing in CI sometimes https://circleci.com/gh/cypress-io/cypress/5655
      it.skip "waits for the 4th request before resolving", ->
        resp = {foo: "foo"}
        response = 0

        win = cy.state("window")

        cy.on "command:retry", (options) ->
          ## only add a request for the first unique retry
          ## for each request
          if options._retries is 1
            response += 1
            win.$.get("/users", {num: response})

        cy
          .server()
          .route(/users/, resp).as("getUsers")
          .wait(["@getUsers", "@getUsers", "@getUsers"]).spread (xhr1, xhr2, xhr3) ->
            expect(xhr1.url).to.include "/users?num=1"
            expect(xhr2.url).to.include "/users?num=2"
            expect(xhr3.url).to.include "/users?num=3"
          .wait("@getUsers").then (xhr) ->
            expect(xhr.url).to.include "/users?num=4"
            expect(xhr.responseBody).to.deep.eq resp
      null

    describe "errors", ->
      describe "invalid 1st argument", ->
        beforeEach ->
          Cypress.config("defaultCommandTimeout", 50)

        _.each [
            { type: 'NaN', val: 0/0, errVal: 'NaN' },
            { type: 'Infinity', val: Infinity, errVal: 'Infinity' },
            { type: 'Array', val: [] },
            { type: 'null', val: null },
            { type: 'undefined', val: undefined },
            { type: 'Boolean', val: true },
            { type: 'Object', val: {} },
            { type: 'Symbol', val: Symbol.iterator, errVal: "Symbol(Symbol.iterator)" }
          ], (attrs) =>
          it "throws when 1st arg is #{attrs.type}", (done) =>
            cy.on "fail", (err) =>
              expect(err.message).to.eq "`cy.wait()` only accepts a number, an alias of a route, or an array of aliases of routes. You passed: `#{attrs.errVal || JSON.stringify(attrs.val)}`"
              expect(err.docsUrl).to.eq("https://on.cypress.io/wait")
              done()
            cy.get("body").wait(attrs.val)

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "can turn off logging", ->
        cy.wait(10, {log: false}).then ->
          lastLog = @lastLog

          expect(lastLog).to.be.undefined

      describe "number argument", ->
        it "does not immediately end", ->
          cy.on "log:added", (attrs, log) ->
            if attrs.name is "wait"
              expect(log.get("state")).not.to.eq "passed"

          cy.noop({}).wait(10).then ->
            lastLog = @lastLog

            expect(lastLog.get("state")).to.eq "passed"

        it "does not immediately snapshot", ->
          cy.on "log:added", (attrs, log) ->
            if attrs.name is "wait"
              expect(log.get("snapshots")).not.to.be.ok

          cy.noop({}).wait(10).then ->
            lastLog = @lastLog

            expect(lastLog.get("snapshots").length).to.eq(1)
            expect(lastLog.get("snapshots")[0]).to.be.an("object")

        it "is a type: child if subject", ->
          cy.noop({}).wait(10).then ->
            lastLog = @lastLog

            expect(lastLog.get("type")).to.eq "child"

        it "is a type: child if subject is false", ->
          cy.noop(false).wait(10).then ->
            lastLog = @lastLog

            expect(lastLog.get("type")).to.eq "child"

            it "is a type: parent if subject is null or undefined", ->
          cy.wait(10).then ->
            lastLog = @lastLog

            expect(lastLog.get("type")).to.eq "parent"

        it "#consoleProps", ->
          cy.wait(10).then ->
            expect(@lastLog.invoke("consoleProps")).to.deep.eq {
              Command: "wait"
              "Waited For": "10ms before continuing"
              "Yielded": undefined
            }

        it "#consoleProps as a child", ->
          cy.wrap({}).wait(10).then ->
            expect(@lastLog.invoke("consoleProps")).to.deep.eq {
              Command: "wait"
              "Waited For": "10ms before continuing"
              "Yielded": {}
            }

      describe "alias argument errors", ->
        it ".log", (done) ->
          Cypress.config("requestTimeout", 100)

          numRetries = 0

          cy.on "fail", (err) =>
            obj = {
              name: "wait"
              referencesAlias: [{name: 'getFoo', cardinal: 1, ordinal: "1st"}]
              aliasType: "route"
              type: "parent"
              error: err
              instrument: "command"
              message: "@getFoo"
              # numRetries: numRetries + 1
            }

            lastLog = @lastLog

            _.each obj, (value, key) =>
              expect(lastLog.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

            done()

          cy.on "command:retry", ->
            numRetries += 1

          cy.server()
          cy.route(/foo/, {}).as("getFoo")
          cy.noop({}).wait("@getFoo")

        it "only logs once", (done) ->
          cy.on "fail", (err) =>
            expect(@logs.length).to.eq(1)
            expect(err.message).to.eq("`cy.wait()` could not find a registered alias for: `@foo`.\nYou have not aliased anything yet.")
            done()

          cy.wait("@foo")

        it "#consoleProps multiple aliases", (done) ->
          Cypress.config("requestTimeout", 100)

          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(lastLog.get("error")).to.eq err
            expect(err.message).to.include "`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `getBar`. No request ever occurred."
            done()

          cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .route(/bar/, {}).as("getBar")
            .window().then (win) ->
              xhrGet(win, "/foo")
              null
            .wait(["@getFoo", "@getBar"])

      describe "function argument errors", ->
        it ".log"

        it "#consoleProps"

      describe "alias argument", ->
        it "is a parent command", ->
          cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              xhrGet(win, "/foo")
              null
            .wait("@getFoo").then ->
              lastLog = @lastLog

              expect(lastLog.get("type")).to.eq "parent"

        it "passes as array of referencesAlias", ->
          cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .route(/bar/, {}).as("getBar")
            .window().then (win) ->
              xhrGet(win, "/foo")
              xhrGet(win, "/bar")
              xhrGet(win, "/foo")
              null
            .wait(["@getFoo", "@getBar", "@getFoo"]).then (xhrs) ->
              lastLog = @lastLog

              expect(lastLog.get("referencesAlias")).to.deep.eq [
                {
                  name: "getFoo",
                  cardinal: 1,
                  ordinal: '1st'
                },
                {
                  name: "getBar",
                  cardinal: 1,
                  ordinal: '1st'
                },
                {
                  name: "getFoo",
                  cardinal: 2,
                  ordinal: '2nd'
                }
              ]

        it "#consoleProps waiting on 1 alias", ->
          cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              xhrGet(win, "/foo")
              null
            .wait("@getFoo").then (xhr) ->
              expect(@lastLog.invoke("consoleProps")).to.deep.eq {
                Command: "wait"
                "Waited For": "getFoo"
                Yielded: xhr
              }

        it "#consoleProps waiting on multiple aliases", ->
          cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .route(/bar/, {}).as("getBar")
            .window().then (win) ->
              xhrGet(win, "/foo")
              xhrGet(win, "/bar")
              null
            .wait(["@getFoo", "@getBar"]).then (xhrs) ->
              expect(@lastLog.invoke("consoleProps")).to.deep.eq {
                Command: "wait"
                "Waited For": "getFoo, getBar"
                Yielded: [xhrs[0], xhrs[1]] ## explictly create the array here
              }

      # describe "function argument", ->
      #   it "#consoleProps", ->
      #     retriedThreeTimes = false

      #     retry = _.after 3, ->
      #       retriedThreeTimes = true

      #     cy.on "command:retry", retry

      #     fn = ->
      #       expect(retriedThreeTimes).to.be.true;

      #     cy
      #       .wait(fn).then ->
      #         expect(@lastLog.invoke("consoleProps")).to.deep.eq {
      #           Command: "wait"
      #           "Waited For": _.str.clean(fn.toString())
      #           Retried: "3 times"
      #         }

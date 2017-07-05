{ _, Promise } = window.testUtils

describe "$Cypress.Cy Waiting Commands", ->
  enterCommandTestingMode()

  context "#wait", ->

    describe "number argument", ->
      it "passes delay onto Promise", ->
        delay = @sandbox.spy Promise, "delay"
        @cy.wait(50)
        @cy.on "invoke:end", (obj) ->
          if obj.name is "wait"
            expect(delay).to.be.calledWith 50

      it "does not change the subject", ->
        @cy
          .get("input")
          .then ($input) ->
            @$input = $input
          .wait(10).then ($input) ->
            expect($input).to.eq @$input

      it "increases timeout by delta", ->
        timeout = @sandbox.spy(@cy, "_timeout")

        @cy
        .wait(50)
        .then ->
          expect(timeout).to.be.calledWith(50, true)

    describe "function argument", ->
      describe "errors thrown", ->
        beforeEach ->
          @currentTest.enableTimeouts(false)
          @uncaught = @allowErrors()

        it "is deprecated", (done) ->
          @cy.on "fail", (err) =>
            expect(err.message).to.eq "cy.wait(fn) has been deprecated. Instead just change this command to be cy.should(fn)."
            done()

          @cy.get("body").wait ($body) ->
            expect($body).to.match("body")

    describe "alias argument", ->
      it "waits for a route alias to have a response", ->
        response = {foo: "foo"}

        @cy
          .visit("http://localhost:3500/fixtures/xhr.html")
          .server()
          .route("GET", /.*/, response).as("fetch")
          .window().then (win) ->
            win.$.get("/foo")
          .wait("@fetch").then (xhr) ->
            expect(xhr.responseBody).to.deep.eq response

      it "waits for the route alias to have a request", ->
        @cy.on "retry", _.once =>
          win = @cy.privateState("window")
          win.$.get("/users")
          null

        @cy
          .visit("http://localhost:3500/fixtures/xhr.html")
          .server({delay: 1000})
          .route(/users/, {}).as("getUsers")
          .wait("@getUsers.request").then (xhr) ->
            expect(xhr.url).to.include "/users"
            expect(xhr.response).to.be.null

      it "passes timeout option down to requestTimeout of wait", (done) ->
        retry = _.after 3, _.once =>
          @cy.privateState("window").$.get("/foo")

        @cy.on "retry", (options) ->
          expect(options.timeout).to.eq 900
          done()

        @cy
          .server()
          .route("GET", /.*/, {}).as("fetch")
          .visit("http://localhost:3500/fixtures/xhr.html")
          .wait("@fetch", {timeout: 900})

      it "resets the timeout after waiting", ->
        prevTimeout = @cy._timeout()

        retry = _.after 3, _.once =>
          @cy.privateState("window").$.get("/foo")

        @cy.on "retry", retry

        @cy
          .server()
          .route("GET", /.*/, {}).as("fetch")
          .visit("http://localhost:3500/fixtures/xhr.html")
          .wait("@fetch").then ->
            expect(@cy._timeout()).to.eq prevTimeout

      it "waits for requestTimeout", (done) ->
        @Cypress.config("requestTimeout", 199)

        @cy.on "retry", (options) ->
          expect(options.timeout).to.eq(199)
          done()

        @cy
          .server()
          .route("GET", "*", {}).as("fetch")
          .wait("@fetch").then ->
            expect(@cy._timeout()).to.eq 199

      it "waits for responseTimeout", (done) ->
        @Cypress.config("responseTimeout", 299)

        @cy.on "retry", (options) ->
          expect(options.timeout).to.eq(299)
          done()

        @cy
          .visit("http://localhost:3500/fixtures/xhr.html")
          .server({delay: 100})
          .route("GET", "*", {}).as("fetch")
          .window().then (win) ->
            win.$.get("/foo")
            null
          .wait("@fetch")

      describe "errors", ->
        beforeEach ->
          @currentTest.enableTimeouts(false)
          @allowErrors()

        it "throws when alias doesnt match a route", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() only accepts aliases for routes.\nThe alias: 'b' did not match a route."
            done()

          @cy.get("body").as("b").wait("@b")

        it "throws when route is never resolved", (done) ->
          @Cypress.config("requestTimeout", 100)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 100ms for the 1st request to the route: 'fetch'. No request ever occured."
            done()

          @cy
            .server()
            .route("GET", /.*/, {}).as("fetch")
            .wait("@fetch")

        it "throws when alias is never requested", (done) ->
          @Cypress.config("requestTimeout", 100)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 100ms for the 1st request to the route: 'foo'. No request ever occured."
            done()

          @cy
            .server()
            .route(/foo/, {}).as("foo")
            .wait("@foo.request")

        it "throws when alias is missing '@' but matches an available alias", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: 'getAny'.\nYou forgot the '@'. It should be written as: '@getAny'."
            done()

          @cy
            .server()
            .route("*", {}).as("getAny")
            .wait("getAny").then ->

        it "throws when 2nd alias doesnt match any registered alias", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq "cy.wait() could not find a registered alias for: '@bar'.\nAvailable aliases are: 'foo'."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("foo")
            .window().then (win) ->
              win.$.get("/foo")
            .wait(["@foo", "@bar"])

        it "throws when 2nd alias is missing '@' but matches an available alias", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: 'bar'.\nYou forgot the '@'. It should be written as: '@bar'."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("foo")
            .route(/bar/, {}).as("bar")
            .window().then (win) ->
              win.$.get("/foo")
            .wait(["@foo", "bar"])

        it "throws when 2nd alias isnt a route alias", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() only accepts aliases for routes.\nThe alias: 'bar' did not match a route."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("foo")
            .get("body").as("bar")
            .window().then (win) ->
              win.$.get("/foo")
            .wait(["@foo", "@bar"])

        it "throws whenever an alias times out", (done) ->
          @Cypress.config("requestTimeout", 100)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 100ms for the 1st request to the route: 'foo'. No request ever occured."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("foo")
            .route(/bar/, {}).as("bar")
            .wait(["@foo", "@bar"])

        it "throws when bar cannot resolve", (done) ->
          @Cypress.config("requestTimeout", 100)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 100ms for the 1st request to the route: 'bar'. No request ever occured."
            done()

          @cy.on "retry", _.once =>
            win = @cy.privateState("window")
            win.$.get("/foo")
            null

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "throws when foo cannot resolve", (done) ->
          @Cypress.config("requestTimeout", 100)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 100ms for the 1st request to the route: 'foo'. No request ever occured."
            done()

          @cy.on "retry", _.once =>
            win = @cy.privateState("window")
            win.$.get("/bar")
            null

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "does not throw another timeout error when 2nd alias is missing @", (done) ->
          Promise.onPossiblyUnhandledRejection (err) ->
            done(err)

          @Cypress.config("requestTimeout", 100)

          @cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: 'bar'.\nYou forgot the '@'. It should be written as: '@bar'."
            _.delay ->
              done()
            , 500

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("foo")
            .route(/bar/, {}).as("bar")
            .wait(["@foo", "bar"])

        it "does not throw again when 2nd alias doesnt reference a route", (done) ->
          Promise.onPossiblyUnhandledRejection done

          @Cypress.config("requestTimeout", 100)

          @cy.on "fail", (err) ->
            expect(err.message).to.eq "cy.wait() only accepts aliases for routes.\nThe alias: 'bar' did not match a route."
            _.delay ->
              done()
            , 500

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("foo")
            .get("body").as("bar")
            .wait(["@foo", "@bar"])

        ## FIXME: not sure why this is failing
        it.skip "does not throw twice when both aliases time out", (done) ->
          Promise.onPossiblyUnhandledRejection done

          @Cypress.config("requestTimeout", 100)

          @cy.on "retry", (options) ->
            ## force bar to time out before foo
            if /bar/.test options.error
              options._runnableTimeout = 0

          @cy.on "fail", (err) =>
            @cy.on "retry", -> done("should not have retried!")

            expect(err.message).to.include "cy.wait() timed out waiting 100ms for the 1st request to the route: 'bar'. No request ever occured."
            _.delay ->
              done()
            , 500

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        ## FIXME: not sure why this is failing
        it.skip "does not retry after 1 alias times out", (done) ->
          Promise.onPossiblyUnhandledRejection done

          @Cypress.config("requestTimeout", 100)

          @cy.on "retry", (options) ->
            ## force bar to time out before foo
            if /bar/.test options.error
              options._runnableTimeout = 0

          @cy.on "fail", (err) =>
            ## should not retry waiting for 'foo'
            ## because bar has timed out
            @cy.on "retry", -> done("should not have retried!")

            _.delay ->
              done()
            , 500

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "throws waiting for the 3rd response", (done) ->
          resp = {foo: "foo"}
          response = 0

          @Cypress.config("requestTimeout", 200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 200ms for the 3rd request to the route: 'getUsers'. No request ever occured."
            done()

          @cy.on "retry", =>
            response += 1

            ## dont send the 3rd response
            return @cy.off("retry") if response is 3
            win = @cy.privateState("window")
            win.$.get("/users", {num: response})

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/users/, resp).as("getUsers")
            .wait(["@getUsers", "@getUsers", "@getUsers"])

        it "throws waiting for the 2nd response", (done) ->
          resp = {foo: "foo"}
          response = 0

          @Cypress.config("requestTimeout", 200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 200ms for the 2nd request to the route: 'getUsers'. No request ever occured."
            done()

          ## dont send the 2nd response
          @cy.on "retry", _.once =>
            response += 1
            win = @cy.privateState("window")
            win.$.get("/users", {num: response})

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/users/, resp).as("getUsers")
            .wait("@getUsers")
            .wait("@getUsers")

        it "throws waiting for the 2nd request", (done) ->
          resp = {foo: "foo"}
          request = 0

          @Cypress.config("requestTimeout", 200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 200ms for the 2nd request to the route: 'getUsers'. No request ever occured."
            done()

          ## dont send the 2nd request
          @cy.on "retry", _.once =>
            request += 1
            win = @cy.privateState("window")
            win.$.get("/users", {num: request})

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/users/, resp).as("getUsers")
            .wait("@getUsers.request")
            .wait("@getUsers.request")

        it "throws when waiting for response to route", (done) ->
          @Cypress.config("responseTimeout", 100)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 100ms for the 1st response to the route: 'response'. No response ever occured."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route("*").as("response")
            .window().then (win) ->
              win.$.get("/timeout?ms=500")
              null
            .wait("@response")

        it "throws when waiting for 2nd response to route", (done) ->
          @Cypress.config("responseTimeout", 200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 200ms for the 2nd response to the route: 'response'. No response ever occured."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route("*").as("response")
            .window().then (win) ->
              win.$.get("/timeout?ms=0")
              win.$.get("/timeout?ms=5000")
              null
            .wait(["@response", "@response"])

        it "throws when waiting for 1st response to bar", (done) ->
          @Cypress.config("responseTimeout", 200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 200ms for the 1st response to the route: 'bar'. No response ever occured."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route("/timeout?ms=0").as("foo")
            .route("/timeout?ms=5000").as("bar")
            .window().then (win) ->
              win.$.get("/timeout?ms=0")
              win.$.get("/timeout?ms=5000")
              null
            .wait(["@foo", "@bar"])

        it "throws when waiting on the 2nd request", (done) ->
          @Cypress.config("requestTimeout", 200)

          @cy.on "retry", _.once =>
            win = @cy.privateState("window")
            win.$.get("/users")
            null

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 200ms for the 2nd request to the route: 'getUsers'. No request ever occured."
            done()

          @cy
            .server({delay: 200})
            .route(/users/, {}).as("getUsers")
            .visit("http://localhost:3500/fixtures/xhr.html")
            .wait("@getUsers.request").then (xhr) ->
              expect(xhr.url).to.include "/users"
              expect(xhr.response).to.be.null
            .wait("@getUsers")

        it "throws when waiting on the 3rd request on array of aliases", (done) ->
          @Cypress.config("requestTimeout", 500)
          @Cypress.config("responseTimeout", 10000)

          @cy.on "retry", _.once =>
            win = @cy.privateState("window")
            _.defer => win.$.get("/timeout?ms=2001")
            _.defer => win.$.get("/timeout?ms=2002")

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 500ms for the 1st request to the route: 'getThree'. No request ever occured."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route("/timeout?ms=2001").as("getOne")
            .route("/timeout?ms=2002").as("getTwo")
            .route(/three/, {}).as("getThree")
            .wait(["@getOne", "@getTwo", "@getThree"])

        it "throws when waiting on the 3rd response on array of aliases", (done) ->
          @Cypress.config("requestTimeout", 200)
          @Cypress.config("responseTimeout", 300)

          @cy.on "retry", _.once =>
            win = @cy.privateState("window")
            _.defer => win.$.get("/timeout?ms=1")
            _.defer => win.$.get("/timeout?ms=2")
            _.defer => win.$.get("/timeout?ms=3000")

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting 300ms for the 1st response to the route: 'getThree'. No response ever occured."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route("/timeout?ms=1").as("getOne")
            .route("/timeout?ms=2").as("getTwo")
            .route("/timeout?ms=3000").as("getThree")
            .route(/three/, {}).as("getThree")
            .wait(["@getOne", "@getTwo", "@getThree"])

        it "throws when passed multiple string arguments", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq "cy.wait() was passed invalid arguments. You cannot pass multiple strings. If you're trying to wait for multiple routes, use an array."
            done()

          @cy.wait("@foo", "@bar")

    describe "multiple alias arguments", ->
      it "can wait for all requests to have a response", ->
        resp1 = {foo: "foo"}
        resp2 = {bar: "bar"}

        @cy
          .visit("http://localhost:3500/fixtures/xhr.html")
          .server()
          .route(/users/, resp1).as("getUsers")
          .route(/posts/, resp2).as("getPosts")
          .window().then (win) ->
            win.$.get("/users")
            win.$.get("/posts")
          .wait(["@getUsers", "@getPosts"]).spread (xhr1, xhr2) ->
            expect(xhr1.responseBody).to.deep.eq resp1
            expect(xhr2.responseBody).to.deep.eq resp2

    describe "multiple separate alias waits", ->
      it "waits for a 3rd request before resolving", ->
        resp = {foo: "foo"}
        response = 0

        @cy.on "retry", =>
          response += 1
          win = @cy.privateState("window")
          win.$.get("/users", {num: response})

        @cy
          .visit("http://localhost:3500/fixtures/xhr.html")
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

      it "waits for the 4th request before resolving", ->
        resp = {foo: "foo"}
        response = 0

        @cy.on "retry", =>
          response += 1
          win = @cy.privateState("window")
          win.$.get("/users", {num: response})

        @cy
          .visit("http://localhost:3500/fixtures/xhr.html")
          .server()
          .route(/users/, resp).as("getUsers")
          .wait(["@getUsers", "@getUsers", "@getUsers"]).spread (xhr1, xhr2, xhr3) ->
            expect(xhr1.url).to.include "/users?num=1"
            expect(xhr2.url).to.include "/users?num=2"
            expect(xhr3.url).to.include "/users?num=3"
          .wait("@getUsers").then (xhr) ->
            expect(xhr.url).to.include "/users?num=4"
            expect(xhr.responseBody).to.deep.eq resp

      describe "errors", ->
        beforeEach ->
          @currentTest.enableTimeouts(false)
          @allowErrors()

        it "throws and includes the incremented alias number"
          ## use underscore.string here for formatting the number

    describe "errors", ->
      describe "invalid 1st argument", ->
        beforeEach ->
          @currentTest.enableTimeouts(false)
          @uncaught = @allowErrors()

        it "is NaN", (done) ->
          @cy.on "fail", (err) =>
            expect(err.message).to.eq "cy.wait() only accepts a number, an alias of a route, or an array of aliases of routes. You passed: NaN"
            done()
          @cy.get("body").wait(0/0)

        it "Infinity", (done) ->
          @cy.on "fail", (err) =>
            expect(err.message).to.eq "cy.wait() only accepts a number, an alias of a route, or an array of aliases of routes. You passed: Infinity"
            done()
          @cy.get("body").wait(Infinity)

        it "is empty array", (done) ->
          @cy.on "fail", (err) =>
            expect(err.message).to.eq "cy.wait() only accepts a number, an alias of a route, or an array of aliases of routes. You passed: []"
            done()
          @cy.get("body").wait([])

        it "is null", (done) ->
          @cy.on "fail", (err) =>
            expect(err.message).to.eq "cy.wait() only accepts a number, an alias of a route, or an array of aliases of routes. You passed: null"
            done()
          @cy.get("body").wait(null)

        it "is undefined", (done) ->
          @cy.on "fail", (err) =>
            expect(err.message).to.eq "cy.wait() only accepts a number, an alias of a route, or an array of aliases of routes. You passed: undefined"
            done()
          @cy.get("body").wait(undefined)

        it "is bool", (done) ->
          @cy.on "fail", (err) =>
            expect(err.message).to.eq "cy.wait() only accepts a number, an alias of a route, or an array of aliases of routes. You passed: true"
            done()
          @cy.get("body").wait(true)

        it "is Object", (done) ->
          @cy.on "fail", (err) =>
            expect(err.message).to.eq "cy.wait() only accepts a number, an alias of a route, or an array of aliases of routes. You passed: {}"
            done()
          @cy.get("body").wait({})

        it "is Symbol", (done) ->
          @cy.on "fail", (err) =>
            expect(err.message).to.eq "cy.wait() only accepts a number, an alias of a route, or an array of aliases of routes. You passed: #{Symbol.iterator.toString()}"
            done()
          @cy.get("body").wait(Symbol.iterator)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "can turn off logging", ->
        cy.wait(10, {log: false}).then ->
          expect(@log).to.be.undefined

      describe "number argument", ->
        it "does not immediately end", ->
          log = null

          @Cypress.on "log", (attrs, l) =>
            log = l
            expect(log.get("state")).not.to.eq "passed"

          @cy.noop({}).wait(10).then ->
            expect(log.get("state")).to.eq "passed"

        it "does not immediately snapshot", ->
          log = null

          @Cypress.on "log", (attrs, l) =>
            log = l
            if log.get("name") is "wait"
              expect(@log.get("snapshots")).not.to.be.ok

          @cy.noop({}).wait(10).then ->
            expect(log.get("snapshots").length).to.eq(1)
            expect(log.get("snapshots")[0]).to.be.an("object")

        it "is a type: child if subject", ->
          @cy.noop({}).wait(10).then ->
            expect(@log.get("type")).to.eq "child"

        it "is a type: child if subject is false", ->
          @cy.noop(false).wait(10).then ->
            expect(@log.get("type")).to.eq "child"

        it "is a type: parent if subject is null or undefined", ->
          @cy.wait(10).then ->
            expect(@log.get("type")).to.eq "parent"

        it "#consoleProps", ->
          @cy.wait(10).then ->
            expect(@log.attributes.consoleProps()).to.deep.eq {
              Command: "wait"
              "Waited For": "10ms before continuing"
              "Yielded": undefined
            }

        it "#consoleProps as a child", ->
          btn = @cy.$$("button:first")

          @cy.get("button:first").wait(10).then ->
            expect(@log.attributes.consoleProps()).to.deep.eq {
              Command: "wait"
              "Waited For": "10ms before continuing"
              "Yielded": btn
            }

      describe "alias argument errors", ->
        beforeEach ->
          @currentTest.enableTimeouts(false)
          @allowErrors()

        it ".log", (done) ->
          @Cypress.config("requestTimeout", 100)

          numRetries = 0

          @cy.on "fail", (err) =>
            obj = {
              name: "wait"
              referencesAlias: ["getFoo"]
              aliasType: "route"
              type: "parent"
              error: err
              instrument: "command"
              message: "@getFoo"
              # numRetries: numRetries + 1
            }

            _.each obj, (value, key) =>
              expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

            done()

          @cy.on "retry", ->
            numRetries += 1

          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .noop({}).wait("@getFoo")

        it "only logs once", (done) ->
          logs = []

          @Cypress.on "log", (attrs, log) ->
            logs.push(log)

          @cy.on "fail", (err) ->
            expect(logs.length).to.eq(1)
            expect(err.message).to.eq("cy.wait() could not find a registered alias for: \'@foo\'.\nYou have not aliased anything yet.")
            done()

          @cy.wait("@foo")

        it "#consoleProps multiple aliases", (done) ->
          @Cypress.config("requestTimeout", 100)

          @cy.on "fail", (err) =>
            expect(@log.get("error")).to.eq err
            expect(err.message).to.include "cy.wait() timed out waiting 100ms for the 1st request to the route: 'getBar'. No request ever occured."
            done()

          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("getFoo")
            .route(/bar/, {}).as("getBar")
            .window().then (win) ->
              win.$.get("foo")
            .wait(["@getFoo", "@getBar"])

      describe "function argument errors", ->
        it ".log"

        it "#consoleProps"

      describe "alias argument", ->
        it "is a parent command", ->
          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("foo")
            .wait("@getFoo").then ->
              expect(@log.get("type")).to.eq "parent"

        it "passes as array of referencesAlias", ->
          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("getFoo")
            .route(/bar/, {}).as("getBar")
            .window().then (win) ->
              win.$.get("foo")
              win.$.get("bar")
            .wait(["@getFoo", "@getBar"]).then (xhrs) ->
              expect(@log.get("referencesAlias")).to.deep.eq ["getFoo", "getBar"]

        it "#consoleProps waiting on 1 alias", ->
          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("foo")
            .wait("@getFoo").then (xhr) ->
              expect(@log.attributes.consoleProps()).to.deep.eq {
                Command: "wait"
                "Waited For": "getFoo"
                Yielded: xhr
              }

        it "#consoleProps waiting on multiple aliases", ->
          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/foo/, {}).as("getFoo")
            .route(/bar/, {}).as("getBar")
            .window().then (win) ->
              win.$.get("foo")
              win.$.get("bar")
            .wait(["@getFoo", "@getBar"]).then (xhrs) ->
              expect(@log.attributes.consoleProps()).to.deep.eq {
                Command: "wait"
                "Waited For": "getFoo, getBar"
                Yielded: [xhrs[0], xhrs[1]] ## explictly create the array here
              }

      # describe "function argument", ->
      #   it "#consoleProps", ->
      #     retriedThreeTimes = false

      #     retry = _.after 3, ->
      #       retriedThreeTimes = true

      #     @cy.on "retry", retry

      #     fn = ->
      #       expect(retriedThreeTimes).to.be.true;

      #     @cy
      #       .wait(fn).then ->
      #         expect(@log.attributes.consoleProps()).to.deep.eq {
      #           Command: "wait"
      #           "Waited For": _.str.clean(fn.toString())
      #           Retried: "3 times"
      #         }

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

      it "does not time out the runnable", ->
        @test.enableTimeouts(false)
        timer = @sandbox.useFakeTimers("setTimeout")
        trigger = @sandbox.spy(@cy, "trigger")
        @cy._timeout(1000)
        @cy.wait()
        timer.tick()
        timer.tick(5000)
        expect(trigger).not.to.be.calledWith "invoke:end"

    describe "function argument", ->
      it "resolves when truthy", ->
        @cy.wait ->
          "foo" is "foo"

      it "retries when false", (done) ->
        i = 0
        fn = ->
          i += 1
          i is 2
        fn = @sandbox.spy fn
        @cy.wait(fn)
        @cy.on "end", ->
          expect(fn.callCount).to.eq 2
          done()

      it "retries when null", (done) ->
        i = 0
        fn = ->
          i += 1
          if i isnt 2 then null else true
        fn = @sandbox.spy fn
        @cy.then(fn).wait(fn)
        @cy.on "end", ->
          expect(fn.callCount).to.eq 2
          done()

      it "resolves when undefined", (done) ->
        ## after returns undefined
        fn = -> undefined

        fn = @sandbox.spy fn
        @cy.wait(fn)

        @cy.on "end", ->
          expect(fn.callCount).to.eq 1
          done()

      it "resolves with existing subject", ->
        @cy
          .get("input").then ($input) ->
            @$input = $input
          .wait(-> true)

        @cy.on "invoke:end", (obj) =>
          if obj.name is "wait"
            expect(@cy.prop("subject")).to.eq @$input

      describe "errors thrown", ->
        beforeEach ->
          @currentTest.enableTimeouts(false)
          @uncaught = @allowErrors()

        it "times out eventually due to false value", (done) ->
          ## forcibly reduce the timeout to 500 ms
          ## so we dont have to wait so long
          @cy.wait (-> false), timeout: 100

          @cy.on "fail", (err) ->
            expect(err.message).to.include "The final value was: false"
            done()

        it "appends to the err message", (done) ->
          @cy.wait (-> expect(true).to.be.false), timeout: 100

          @cy.on "fail", (err) ->
            expect(err.message).to.include "Timed out retrying: Could not continue due to: AssertionError"
            done()

    describe "alias argument", ->
      it "waits for a route alias to have a response", ->
        response = {foo: "foo"}

        @cy
          .server()
          .route("GET", /.*/, response).as("fetch")
          .window().then (win) ->
            win.$.get("/foo")
          .wait("@fetch").then (xhr) ->
            obj = JSON.parse(xhr.responseText)
            expect(obj).to.deep.eq response

      it "waits for the route alias to have a request", ->
        @cy.on "retry", _.once =>
          win = @cy.private("window")
          win.$.get("/users")
          null

        @cy
          .server({delay: 1000})
          .route(/users/, {}).as("getUsers")
          .wait("@getUsers.request").then (xhr) ->
            expect(xhr.url).to.eq "/users"
            expect(xhr.readyState).to.eq 1

      it "waits for the route alias to have a request + response", ->
        @cy.on "retry", _.once =>
          win = @cy.private("window")
          win.$.get("/users")
          null

        @cy
          .server({delay: 200})
          .route(/users/, {}).as("getUsers")
          .wait("@getUsers.request").then (xhr) ->
            expect(xhr.url).to.eq "/users"
            expect(xhr.readyState).to.eq 1
          .wait("@getUsers").then (xhr) ->
            expect(xhr.readyState).to.eq 4
            expect(xhr.responseText).to.eq "{}"

      it "resets the timeout after waiting", ->
        prevTimeout = @cy._timeout()

        retry = _.after 3, _.once =>
          @cy.private("window").$.get("/foo")

        @cy.on "retry", retry

        @cy
          .server()
          .route("GET", /.*/, {}).as("fetch")
          .wait("@fetch").then ->
            expect(@cy._timeout()).to.eq prevTimeout

      describe "errors", ->
        beforeEach ->
          @currentTest.enableTimeouts(false)
          @allowErrors()

        it "throws when alias doesnt match a route", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() can only accept aliases for routes.  The alias: 'b' did not match a route."
            done()

          @cy.get("body").as("b").wait("@b")

        it "throws when route is never resolved", (done) ->
          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting for the 1st response to the route: 'fetch'. No response ever occured."
            done()

          @cy
            .server()
            .route("GET", /.*/, {}).as("fetch")
            .wait("@fetch")

        it "throws when alias is never requested", (done) ->
          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting for the 1st request to the route: 'foo'. No request ever occured."
            done()

          @cy
            .server()
            .route(/foo/, {}).as("foo")
            .wait("@foo.request")

        it "throws when alias is missing '@' but matches an available alias", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: 'getAny'. You forgot the '@'. It should be written as: '@getAny'."
            done()

          @cy
            .server()
            .route("*", {}).as("getAny")
            .wait("getAny").then ->

        it "throws when 2nd alias doesnt match any registered alias", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq "cy.wait() could not find a registered alias for: 'bar'. Available aliases are: 'foo'."
            done()

          @cy
            .server()
            .route(/foo/, {}).as("foo")
            .window().then (win) ->
              win.$.get("/foo")
            .wait(["@foo", "@bar"])

        it "throws when 2nd alias is missing '@' but matches an available alias", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: 'bar'. You forgot the '@'. It should be written as: '@bar'."
            done()

          @cy
            .server()
            .route(/foo/, {}).as("foo")
            .route(/bar/, {}).as("bar")
            .window().then (win) ->
              win.$.get("/foo")
            .wait(["@foo", "bar"])

        it "throws when 2nd alias isnt a route alias", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() can only accept aliases for routes.  The alias: 'bar' did not match a route."
            done()

          @cy
            .server()
            .route(/foo/, {}).as("foo")
            .get("body").as("bar")
            .window().then (win) ->
              win.$.get("/foo")
            .wait(["@foo", "@bar"])

        it "throws whenever an alias times out", (done) ->
          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting for the 1st response to the route: 'foo'. No response ever occured."
            done()

          @cy
            .server()
            .route(/foo/, {}).as("foo")
            .route(/bar/, {}).as("bar")
            .wait(["@foo", "@bar"])

        it "throws when bar cannot resolve", (done) ->
          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting for the 1st response to the route: 'bar'. No response ever occured."
            done()

          @cy.on "retry", _.once =>
            win = @cy.private("window")
            win.$.get("/foo")
            null

          @cy
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "throws when foo cannot resolve", (done) ->
          @enableTimeouts(false)

          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting for the 1st response to the route: 'foo'. No response ever occured."
            done()

          @cy.on "retry", _.once =>
            win = @cy.private("window")
            win.$.get("/bar")
            null

          @cy
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "does not throw another timeout error when 2nd alias is missing @", (done) ->
          Promise.onPossiblyUnhandledRejection (err) ->
            done(err)

          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: 'bar'. You forgot the '@'. It should be written as: '@bar'."
            _.delay ->
              done()
            , 500

          @cy
            .server()
            .route(/foo/, {}).as("foo")
            .route(/bar/, {}).as("bar")
            .wait(["@foo", "bar"])

        it "does not throw again when 2nd alias doesnt reference a route", (done) ->
          Promise.onPossiblyUnhandledRejection done

          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.eq "cy.wait() can only accept aliases for routes.  The alias: 'bar' did not match a route."
            _.delay ->
              done()
            , 500

          @cy
            .server()
            .route(/foo/, {}).as("foo")
            .get("body").as("bar")
            .wait(["@foo", "@bar"])

        it "does not throw twice when both aliases time out", (done) ->
          Promise.onPossiblyUnhandledRejection done

          @cy._timeout(200)

          @cy.on "retry", (options) ->
            ## force bar to time out before foo
            if /bar/.test options.error
              options._runnableTimeout = 0

          @cy.on "fail", (err) =>
            @cy.on "retry", -> done("should not have retried!")

            expect(err.message).to.include "cy.wait() timed out waiting for the 1st response to the route: 'bar'. No response ever occured."
            _.delay ->
              done()
            , 500

          @cy
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "does not retry after 1 alias times out", (done) ->
          Promise.onPossiblyUnhandledRejection done

          @cy._timeout(200)

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
            .server()
            .route(/foo/, {foo: "foo"}).as("foo")
            .route(/bar/, {bar: "bar"}).as("bar")
            .wait(["@foo", "@bar"])

        it "throws waiting for the 3rd response", (done) ->
          resp = {foo: "foo"}
          response = 0

          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting for the 3rd response to the route: 'getUsers'. No response ever occured."
            done()

          @cy.on "retry", =>
            response += 1

            ## dont send the 3rd response
            return @cy.off("retry") if response is 3
            win = @cy.private("window")
            win.$.get("/users", {num: response})

          @cy
            .server()
            .route(/users/, resp).as("getUsers")
            .wait(["@getUsers", "@getUsers", "@getUsers"])

        it "throws waiting for the 2nd response", (done) ->
          resp = {foo: "foo"}
          response = 0

          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting for the 2nd response to the route: 'getUsers'. No response ever occured."
            done()

          ## dont send the 2nd response
          @cy.on "retry", _.once =>
            response += 1
            win = @cy.private("window")
            win.$.get("/users", {num: response})

          @cy
            .server()
            .route(/users/, resp).as("getUsers")
            .wait("@getUsers")
            .wait("@getUsers")

        it "throws waiting for the 2nd request", (done) ->
          resp = {foo: "foo"}
          request = 0

          @cy._timeout(200)

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting for the 2nd request to the route: 'getUsers'. No request ever occured."
            done()

          ## dont send the 2nd request
          @cy.on "retry", _.once =>
            request += 1
            win = @cy.private("window")
            win.$.get("/users", {num: request})

          @cy
            .server()
            .route(/users/, resp).as("getUsers")
            .wait("@getUsers.request")
            .wait("@getUsers.request")

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
          .server()
          .route(/users/, resp1).as("getUsers")
          .route(/posts/, resp2).as("getPosts")
          .window().then (win) ->
            win.$.get("/users")
            win.$.get("/posts")
          .wait(["@getUsers", "@getPosts"]).spread (xhr1, xhr2) ->
            obj1 = JSON.parse(xhr1.responseText)
            obj2 = JSON.parse(xhr2.responseText)
            expect(obj1).to.deep.eq resp1
            expect(obj2).to.deep.eq resp2

    describe "multiple separate alias waits", ->
      it "waits for a 3rd request before resolving", ->
        resp = {foo: "foo"}
        response = 0

        @cy.on "retry", =>
          response += 1
          win = @cy.private("window")
          win.$.get("/users", {num: response})

        @cy
          .server()
          .route(/users/, resp).as("getUsers")
          .wait("@getUsers").then (xhr) ->
            expect(xhr.url).to.eq "/users?num=1"
            expect(xhr.responseText).to.eq JSON.stringify(resp)
          .wait("@getUsers").then (xhr) ->
            expect(xhr.url).to.eq "/users?num=2"
            expect(xhr.responseText).to.eq JSON.stringify(resp)
          .wait("@getUsers").then (xhr) ->
            expect(xhr.url).to.eq "/users?num=3"
            expect(xhr.responseText).to.eq JSON.stringify(resp)

      it "waits for the 4th request before resolving", ->
        resp = {foo: "foo"}
        response = 0

        @cy.on "retry", =>
          response += 1
          win = @cy.private("window")
          win.$.get("/users", {num: response})

        @cy
          .server()
          .route(/users/, resp).as("getUsers")
          .wait(["@getUsers", "@getUsers", "@getUsers"]).spread (xhr1, xhr2, xhr3) ->
            expect(xhr1.url).to.eq "/users?num=1"
            expect(xhr2.url).to.eq "/users?num=2"
            expect(xhr3.url).to.eq "/users?num=3"
          .wait("@getUsers").then (xhr) ->
            expect(xhr.url).to.eq "/users?num=4"
            expect(xhr.responseText).to.eq JSON.stringify(resp)

      describe "errors", ->
        beforeEach ->
          @currentTest.enableTimeouts(false)
          @allowErrors()

        it "throws and includes the incremented alias number"
          ## use underscore string here for formatting the number

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "can turn off logging", ->
        cy.wait(10, {log: false}).then ->
          expect(@log).to.be.undefined

      describe "number argument", ->
        it "does not immediately end", ->
          log = null

          @Cypress.on "log", (l) =>
            log = l
            expect(log.get("state")).not.to.eq "passed"

          @cy.noop({}).wait(10).then ->
            expect(log.get("state")).to.eq "passed"

        it "does not immediately snapshot", ->
          log = null

          @Cypress.on "log", (l) =>
            log = l
            expect(log.get("snapshot")).not.to.be.ok

          @cy.noop({}).wait(10).then ->
            expect(log.get("snapshot")).to.be.an("object")

        it "is a type: child if subject", ->
          @cy.noop({}).wait(10).then ->
            expect(@log.get("type")).to.eq "child"

        it "is a type: child if subject is false", ->
          @cy.noop(false).wait(10).then ->
            expect(@log.get("type")).to.eq "child"

        it "is a type: parent if subject is null or undefined", ->
          @cy.wait(10).then ->
            expect(@log.get("type")).to.eq "parent"

        it "#onConsole", ->
          @cy.wait(10).then ->
            expect(@log.attributes.onConsole()).to.deep.eq {
              Command: "wait"
              "Waited For": "10ms before continuing"
              "Returned": undefined
            }

        it "#onConsole as a child", ->
          btn = @cy.$("button:first")

          @cy.get("button:first").wait(10).then ->
            expect(@log.attributes.onConsole()).to.deep.eq {
              Command: "wait"
              "Waited For": "10ms before continuing"
              "Returned": btn
            }

      describe "alias argument errors", ->
        beforeEach ->
          @currentTest.enableTimeouts(false)
          @allowErrors()

        it ".log", (done) ->
          @enableTimeouts(false)

          @cy._timeout(200)

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

        it "#onConsole multiple aliases", (done) ->
          @cy._timeout(200)

          @cy.on "fail", (err) =>
            expect(@log.get("error")).to.eq err
            expect(err.message).to.include "cy.wait() timed out waiting for the 1st response to the route: 'getBar'. No response ever occured."
            done()

          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .route(/bar/, {}).as("getBar")
            .window().then (win) ->
              win.$.get("foo")
            .wait(["@getFoo", "@getBar"])

      describe "function argument errors", ->
        it ".log"

        it "#onConsole"

      describe "alias argument", ->
        it "is a parent command", ->
          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("foo")
            .wait("@getFoo").then ->
              expect(@log.get("type")).to.eq "parent"

        it "passes as array of referencesAlias", ->
          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .route(/bar/, {}).as("getBar")
            .window().then (win) ->
              win.$.get("foo")
              win.$.get("bar")
            .wait(["@getFoo", "@getBar"]).then (xhrs) ->
              expect(@log.get("referencesAlias")).to.deep.eq ["getFoo", "getBar"]

        it "#onConsole waiting on 1 alias", ->
          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("foo")
            .wait("@getFoo").then (xhr) ->
              expect(@log.attributes.onConsole()).to.deep.eq {
                Command: "wait"
                "Waited For": "getFoo"
                Returned: xhr
              }

        it "#onConsole waiting on multiple aliases", ->
          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .route(/bar/, {}).as("getBar")
            .window().then (win) ->
              win.$.get("foo")
              win.$.get("bar")
            .wait(["@getFoo", "@getBar"]).then (xhrs) ->
              expect(@log.attributes.onConsole()).to.deep.eq {
                Command: "wait"
                "Waited For": "getFoo, getBar"
                Returned: [xhrs[0], xhrs[1]] ## explictly create the array here
              }

      # describe "function argument", ->
      #   it "#onConsole", ->
      #     retriedThreeTimes = false

      #     retry = _.after 3, ->
      #       retriedThreeTimes = true

      #     @cy.on "retry", retry

      #     fn = ->
      #       expect(retriedThreeTimes).to.be.true;

      #     @cy
      #       .wait(fn).then ->
      #         expect(@log.attributes.onConsole()).to.deep.eq {
      #           Command: "wait"
      #           "Waited For": _.str.clean(fn.toString())
      #           Retried: "3 times"
      #         }


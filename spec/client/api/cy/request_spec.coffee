describe "$Cypress.Cy Request Commands", ->
  enterCommandTestingMode()

  context "#request", ->
    beforeEach ->
      @responseIs = (resp, timeout = 10) =>
        @Cypress.trigger.restore?()

        @sandbox.spy(@Cypress, "trigger")

        trigger = @Cypress.trigger
        @Cypress.trigger = (args...) ->
          if args[0] is "request"
            trigger.apply(@, arguments)
            _.delay ->
              args[2](resp)
            , timeout
          else
            trigger.apply(@, arguments)

    describe "argument signature", ->
      beforeEach ->
        trigger = @sandbox.stub(@Cypress, "trigger").withArgs("request").callsArgWithAsync(2, {status: 200})

        @cy.on "fail", (err) ->
          debugger

        @expectOptionsToBe = (opts) ->
          options = trigger.getCall(0).args[1]
          _.each options, (value, key) ->
            expect(options[key]).to.deep.eq(opts[key], "failed on property: (#{key})")
          _.each opts, (value, key) ->
            expect(opts[key]).to.deep.eq(options[key], "failed on property: (#{key})")

      it "accepts object with url", ->
        @cy.request({url: "http://localhost:8000/foo"}).then ->
          @expectOptionsToBe({
            url: "http://localhost:8000/foo"
            method: "GET"
            gzip: true
          })

      it "accepts object with url, method, headers, body", ->
        @cy.request({
          url: "http://github.com/users"
          method: "POST"
          body: {name: "brian"}
          headers: {
            "x-token": "abc123"
          }
        }).then ->
          @expectOptionsToBe({
            url: "http://github.com/users"
            method: "POST"
            json: true
            gzip: true
            body: {name: "brian"}
            headers: {
              "x-token": "abc123"
            }
          })

      it "accepts string url", ->
        @cy.request("http://localhost:8080/status").then ->
          @expectOptionsToBe({
            url: "http://localhost:8080/status"
            method: "GET"
            gzip: true
          })

      it "accepts method + url", ->
        @cy.request("DELETE", "http://localhost:1234/users/1").then ->
          @expectOptionsToBe({
            url: "http://localhost:1234/users/1"
            method: "DELETE"
            gzip: true
          })

      it "accepts method + url + body", ->
        @cy.request("POST", "http://localhost:8080/users", {name: "brian"}).then ->
          @expectOptionsToBe({
            url: "http://localhost:8080/users"
            method: "POST"
            body: {name: "brian"}
            json: true
            gzip: true
          })

      it "accepts url + body", ->
        @cy.request("http://www.github.com/projects/foo", {commits: true}).then ->
          @expectOptionsToBe({
            url: "http://www.github.com/projects/foo"
            method: "GET"
            body: {commits: true}
            json: true
            gzip: true
          })

      it "accepts url + string body", ->
        @cy.request("http://www.github.com/projects/foo", "foo").then ->
          @expectOptionsToBe({
            url: "http://www.github.com/projects/foo"
            method: "GET"
            body: "foo"
            gzip: true
          })

      context "method normalization", ->
        it "uppercases method", ->
          @cy.request("post", "https://www.foo.com").then ->
            @expectOptionsToBe({
              url: "https://www.foo.com/"
              method: "POST"
              gzip: true
            })

      context "url normalization", ->
        it "uses absolute urls and adds trailing slash", ->
          @cy.private("baseUrl", "http://localhost:8080/app")

          @cy.request("https://www.foo.com").then ->
            @expectOptionsToBe({
              url: "https://www.foo.com/"
              method: "GET"
              gzip: true
            })

        it "uses localhost urls", ->
          @cy.request("localhost:1234").then ->
            @expectOptionsToBe({
              url: "http://localhost:1234/"
              method: "GET"
              gzip: true
            })

        it "prefixes with baseUrl when origin is empty", ->
          @sandbox.stub(@cy, "_getLocation").withArgs("origin").returns("")
          @cy.private("baseUrl", "http://localhost:8080/app")

          @cy.request("/foo/bar?cat=1").then ->
            @expectOptionsToBe({
              url: "http://localhost:8080/app/foo/bar?cat=1"
              method: "GET"
              gzip: true
            })

        it "prefixes with current origin over baseUrl", ->
          @cy.private("baseUrl", "http://localhost:8080/app")
          @sandbox.stub(@cy, "_getLocation").withArgs("origin").returns("http://localhost:1234")

          @cy.request("foobar?cat=1").then ->
            @expectOptionsToBe({
              url: "http://localhost:1234/foobar?cat=1"
              method: "GET"
              gzip: true
            })

      context "gzip", ->
        it "can turn off gzipping", ->
          @cy.request({
            url: "http://localhost:8080"
            gzip: false
          }).then ->
            @expectOptionsToBe({
              url: "http://localhost:8080/"
              method: "GET"
              gzip: false
            })

      context "cookies", ->
        it "gets all cookies when true", ->
          @sandbox.stub(@Cypress.Cookies, "getAllCookies").returns({foo: "barbaz"})

          @cy.request({
            url: "http://github.com/users"
            cookies: true
          }).then ->
            @expectOptionsToBe({
              url: "http://github.com/users"
              method: "GET"
              cookies: {foo: "barbaz"}
              gzip: true
            })

        it "sends cookies as is if object", ->
          @cy.request({
            url: "http://github.com/users"
            cookies: {foo: "bar"}
          }).then ->
            @expectOptionsToBe({
              url: "http://github.com/users"
              method: "GET"
              cookies: {foo: "bar"}
              gzip: true
            })

      context "auth", ->
        it "sends auth when it is an object", ->
          @cy.request({
            url: "http://localhost:8888"
            auth: {
              user: "brian"
              pass: "password"
            }
          }).then ->
            @expectOptionsToBe({
              url: "http://localhost:8888/"
              method: "GET"
              gzip: true
              auth: {
                user: "brian"
                pass: "password"
              }
            })

      context "failOnStatus", ->
        it "does not fail even on 500 when failOnStatus=false", ->
          @responseIs({status: 500})

          @cy.request({url: "http://localhost:1234/foo", failOnStatus: false}).then (resp) ->
            ## make sure it really was 500!
            expect(resp.status).to.eq(500)

    describe "subjects", ->
      it "resolves with response obj", ->
        resp = {status: 200, headers: {foo: "bar"}, body: "<html>foo</html>"}

        @responseIs(resp)

        @cy.request("http://www.foo.com").then (subject) ->
          expect(subject).to.deep.eq(resp)

    describe "timeout", ->
      it "sets timeout to be 20 secs", ->
        @responseIs({status: 200})

        timeout = @sandbox.spy(Promise.prototype, "timeout")

        @cy.request("http://www.foo.com").then ->
          expect(timeout).to.be.calledWith(20000)

      it "can override timeout", ->
        @responseIs({status: 200})

        timeout = @sandbox.spy(Promise.prototype, "timeout")

        @cy.request({url: "http://www.foo.com", timeout: 1000}).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        @responseIs({status: 200})

        @cy._timeout(100)

        _clearTimeout = @sandbox.spy(@cy, "_clearTimeout")

        @Cypress.on "request", =>
          expect(_clearTimeout).to.be.calledOnce

        @cy.request("http://www.foo.com").then ->
          ## restores the timeout afterwards
          expect(@cy._timeout()).to.eq(100)

    describe "cancellation", ->
      it "cancels promise", (done) ->
        ## respond after 50 ms
        @responseIs({}, 50)

        @Cypress.on "log", (@log) =>
          @cmd = @cy.commands.first()
          @Cypress.abort()

        @cy.on "cancel", (cancelledCmd) =>
          _.delay =>
            expect(cancelledCmd).to.eq(@cmd)
            expect(@cmd.get("subject")).to.be.undefined
            expect(@log.get("state")).to.eq("pending")
            done()
          , 100

        @cy.request("http://www.foo.com")

    describe ".log", ->
      beforeEach ->
        @sandbox.spy(@Cypress, "trigger")

        trigger = @Cypress.trigger
        @Cypress.trigger = (args...) ->
          if args[0] is "request"
            _.delay ->
              args[2]({status: 200})
            , 10
          else
            trigger.apply(@, arguments)

        @Cypress.on "log", (@log) =>

      it "can turn off logging", ->
        @cy.request({
          url: "http://localhost:8080"
          log: false
        }).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (log) ->
          if log.get("name") is "request"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("")
            done()

        @cy.request("http://localhost:8080")

      it "snapshots after clicking", ->
        @cy.request("http://localhost:8080").then ->
          expect(@log.get("snapshot")).to.be.an("object")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when no url is passed", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request requires a url. You did not provide a url.")
          done()

        @cy.request()

      it "throws when url is not FQDN", (done) ->
        @cy.private("baseUrl", "")
        @sandbox.stub(@cy, "_getLocation").withArgs("origin").returns("")

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request must be provided a fully qualified url - one that begins with 'http'. By default cy.request will use either the current window's origin or the 'baseUrl' in cypress.json. Neither of those values were present.")
          done()

        @cy.request("/foo/bar")

      it "throws when url isnt a string", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request requires the url to be a string.")
          done()

        @cy.request({
          url: []
        })

      it "throws when auth is truthy but not an object", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request must be passed an object literal for the 'auth' option.")
          done()

        @cy.request({
          url: "http://localhost:1234/foo"
          auth: "foobar"
        })

      it "throws when cookies is truthy but not an object", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request requires cookies to be true, or an object literal.")
          done()

        @cy.request({
          url: "http://localhost:1234/foo"
          cookies: "foo=bar"
        })

      it "throws when headers is truthy but not an object", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request requires headers to be an object literal.")
          done()

        @cy.request({
          url: "http://localhost:1234/foo"
          headers: "foo=bar"
        })

      it "throws on invalid method", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request() was called with an invalid method: 'FOO'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS")
          done()

        @cy.request({
          url: "http://localhost:1234/foo"
          method: "FOO"
        })

      it "throws when gzip is not boolean", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request requires gzip to be a boolean.")
          done()

        @cy.request({
          url: "http://localhost:1234/foo"
          gzip: {}
        })

      it "throws when status code doesnt start with 2 and failOnStatus is true", (done) ->
        @responseIs({status: 500})

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request failed because the response had the status code: 500")
          done()

        @cy.request("http://localhost:1234/foo")

      it "throws when response has __error", (done) ->
        @responseIs({__error: "request failed"})

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("request failed")
          done()

        @cy.request("http://localhost:1234/foo")

      it "throws after timing out", (done) ->
        @responseIs({status: 200}, 250)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(err.message).to.eq("cy.request timed out waiting '50ms' for a response. No response ever occured.")
          done()

        @cy.request({url: "http://localhost:1234/foo", timeout: 50})

describe "$Cypress.Cy Request Commands", ->
  enterCommandTestingMode()

  context "#request", ->
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
          })

      it "accepts method + url", ->
        @cy.request("DELETE", "http://localhost:1234/users/1").then ->
          @expectOptionsToBe({
            url: "http://localhost:1234/users/1"
            method: "DELETE"
          })

      it "accepts method + url + body", ->
        @cy.request("POST", "http://localhost:8080/users", {name: "brian"}).then ->
          @expectOptionsToBe({
            url: "http://localhost:8080/users"
            method: "POST"
            body: {name: "brian"}
            json: true
          })

      it "accepts url + body", ->
        @cy.request("http://www.github.com/projects/foo", {commits: true}).then ->
          @expectOptionsToBe({
            url: "http://www.github.com/projects/foo"
            method: "GET"
            body: {commits: true}
            json: true
          })

      it "accepts url + string body", ->
        @cy.request("http://www.github.com/projects/foo", "foo").then ->
          @expectOptionsToBe({
            url: "http://www.github.com/projects/foo"
            method: "GET"
            body: "foo"
          })

      context "cookies", ->
        it "normalizes cookies when true"

        it "sends cookies as is if object", ->
          @cy.request({
            url: "http://github.com/users"
            cookies: {foo: "bar"}
          }).then ->
            @expectOptionsToBe({
              url: "http://github.com/users"
              method: "GET"
              cookies: {foo: "bar"}
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
              url: "http://localhost:8888"
              method: "GET"
              auth: {
                user: "brian"
                pass: "password"
              }
            })

    describe "errors", ->
      it "throws when auth is truthy but not an object"

      it "throws when cookies is truthy but not an object"

      it "throws on invalid method"

      it "throws when no url is passed"
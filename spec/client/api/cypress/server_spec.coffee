describe "$Cypress.Cy Server API", ->
  it ".create", ->
    fakeServer = @sandbox.useFakeServer()
    server = $Cypress.Server.create(fakeServer, {})
    expect(server).to.be.instanceof $Cypress.Server

  context ".constructor", ->
    beforeEach ->
      @fakeServer = @sandbox.useFakeServer()
      @server = $Cypress.Server.create(@fakeServer, {delay: 10})

    it "sets queue to []", ->
      expect(@server.queue).to.deep.eq []

    it "has a a reference to sinon's fakeServer", ->
      expect(@server.fakeServer).to.eq @fakeServer

    it "sets respondImmediately to true by default", ->
      expect(@fakeServer.respondImmediately).to.be.true

    it "sets delay to 10", ->
      expect(@server._delay).to.eq 10

  context "#respondImmediately", ->
    beforeEach ->
      @setup = (opts = {}) =>
        _.defaults opts, delay: 10
        @fakeServer = @sandbox.useFakeServer()
        @server = $Cypress.Server.create(@fakeServer, opts)

    it "by default calls fakeServer.respond", ->
      @setup()
      respond = @sandbox.spy @fakeServer, "respond"
      $.get("/users")
      expect(respond).to.be.calledOnce

    it "does not call fakeServer.respond when respondImmediately is false", ->
      @setup({respond: false})
      respond = @sandbox.spy @fakeServer, "respond"
      $.get("/users")
      expect(respond).not.to.be.called

  context "#server.respond", ->
    it "does not resolve until all responses have resolved", ->
      @fakeServer = @sandbox.useFakeServer()
      @server = $Cypress.Server.create(@fakeServer, respond: false)
      $.get("/users")
      $.get("/users")
      $.get("/users")
      @server.respond().then (xhrs) ->
        statuses = _.pluck(xhrs, "status")
        expect(xhrs).to.have.length(3)
        expect(statuses).to.deep.eq [404, 404, 404]

    describe "with {respond: false}", ->
      beforeEach ->
        @fakeServer = @sandbox.useFakeServer()
        @server = $Cypress.Server.create(@fakeServer, delay: 10, respond: false)

      it "can forcibly respond to all requests in the queue", ->
        @server.stub url: /users/, response: {}, method: "GET"
        $.get("/users")
        request = @fakeServer.requests[0]
        @sandbox.spy request, "respond"
        @server.respond()
        expect(request.respond).to.be.called

      it "ignores delay", ->
        delay = @sandbox.spy Promise, "delay"
        @server.stub url: /users/, response: {}, method: "GET", delay: 50
        $.get("/users")
        @server.respond()
        expect(delay).to.be.calledWith 0

    describe "with {respond: true}", ->
      beforeEach ->
        @fakeServer = @sandbox.useFakeServer()
        @server = $Cypress.Server.create(@fakeServer, {delay: 10, respond: true})

      it "does not respond to an xhr which has {respond: false} when respondImmediately is true", (done) ->
        @server.stub url: /users/, response: {}, method: "GET", respond: false
        $.get("/users")

        ## should not have pushed a promise into our queue
        expect(@server.queue).to.have.length(0)
        _.delay =>
          ## and should not have responded to the request
          expect(@fakeServer.requests[0].readyState).to.eq 1
          done()
        , 100

      it "xhr is put back into the fakeServer queue if its not responded to", ->
        expect(@fakeServer.queue).to.be.undefined
        @server.stub url: /users/, response: {}, method: "GET", respond: false
        $.get("/users")
        expect(@fakeServer.queue).to.have.length(1)

      it "initially doesnt respond then forcefully responds later", (done) ->
        @server.stub url: /users/, response: {}, method: "GET", respond: false
        $.get("/users")
        _.delay =>
          request = @fakeServer.requests[0]
          expect(request.readyState).to.eq 1

          ## now forcefully respond here
          @server.respond()

          _.delay =>
            expect(request.readyState).to.eq 4
            done()
          , 100
        , 100

  context "#xhr.respond", ->
    beforeEach ->
      @setup = (opts = {}) =>
        _.defaults opts, delay: 10, respond: true
        @fakeServer = @sandbox.useFakeServer()
        @server = $Cypress.Server.create(@fakeServer, opts)

    it "pushes the promise into server.queue", ->
      @setup()
      expect(@server.queue).to.have.length(0)
      $.get("/users")
      expect(@server.queue).to.have.length(1)

    it "inherits its delay from server.delay", ->
      delay = @sandbox.spy Promise, "delay"
      @setup({delay: 100})
      @server.stub url: /users/, response: {}, method: "GET"
      $.get("/users")
      expect(delay).to.be.calledWith 100

    it "can have a specific delay itself", ->
      delay = @sandbox.spy Promise, "delay"
      @setup({delay: 20})
      @server.stub url: /users/, response: {}, method: "GET", delay: 50
      $.get("/users")
      expect(delay).to.be.calledWith 50

    it "inherits its delay from server.delay on a 404", ->
      delay = @sandbox.spy Promise, "delay"
      @setup({delay: 100})
      $.get("/users")
      expect(delay).to.be.calledWith 100

    it "returns if isResponding is true", ->
      @setup()
      @server.onRequest (@xhr) =>
      @server.stub url: /users/, response: {}, method: "GET", delay: 50
      $.get("/users")
      expect(@xhr.isResponding).to.be.true
      expect(@xhr.respond()).to.be.undefined

    it "returns if isResponding is true on a 404 route", ->
      @setup({delay: 100})
      @server.onRequest (@xhr) =>
      $.get("/users")
      expect(@xhr.isResponding).to.be.true
      expect(@xhr.respond()).to.be.undefined

    it "does not delay when {respond: false} is on the server", ->
      delay = @sandbox.spy Promise, "delay"
      @setup({delay: 20, respond: false})
      @server.stub url: /users/, response: {}, method: "GET", delay: 50
      $.get("/users")
      @server.respond()
      expect(delay).to.be.calledWith 0

    it "does not delay when {respond: false} is set on the xhr", ->
      delay = @sandbox.spy Promise, "delay"
      @setup({delay: 20})
      @server.stub url: /users/, response: {}, method: "GET", delay: 50, respond: false
      $.get("/users")
      @server.respond()
      expect(delay).to.be.calledWith 0

    it "does not delay when {respond: false} is on the server and no stub", ->
      delay = @sandbox.spy Promise, "delay"
      @setup({delay: 20, respond: false})
      $.get("/users")
      @server.respond()
      expect(delay).to.be.calledWith 0

    it "sets status=0 headers={} body='' when xhr has been aborted", ->
      @setup()
      @server.stub url: /foo/, response: {}, method: "GET", status: 200

      handleAfterResponse = @sandbox.spy(@server, "handleAfterResponse")

      x = $.getJSON("/foo")
      x.abort()

      @server.queue[0].then (xhr) ->
        expect(handleAfterResponse).to.be.calledWith xhr, {status: 0, headers: {}, body: ""}

    it "catches xhr aborts and throws AbortError", ->
      onAbort = @sandbox.stub()

      @setup({onAbort: onAbort})
      @server.stub url: /foo/, response: {}, method: "GET", status: 200

      x = $.getJSON("/foo")
      x.abort()

      @server.queue[0].then (xhr) ->
        expect(onAbort).to.be.calledWith xhr, xhr.matchedRoute

        err = onAbort.getCall(0).args[2]

        expect(err.name).to.eq "AbortError"

      # @server.queue[0].catch (err) ->
        # debugger

  context "#cancel", ->
    beforeEach ->
      @fakeServer = @sandbox.useFakeServer()
      @server = $Cypress.Server.create(@fakeServer, {delay: 200, respond: true})

    it "can cancel promises in the queue", ->
      @server.stub url: /users/, response: {}, method: "GET"
      @server.stub url: /posts/, response: {}, method: "GET"
      @server.stub url: /messages/, response: {}, method: "GET"
      $.get("/users")
      $.get("/posts")
      $.get("/messages")
      expect(@server.queue).to.have.length(3)
      Promise.all(@server.cancel()).then =>
        _.each @fakeServer.requests, (request) ->
          expect(request.aborted).to.be.true
          expect(request.readyState).to.eq 0

  context "#handleAfterResponse", ->
    beforeEach ->
      @fakeServer = @sandbox.useFakeServer()
      @server = $Cypress.Server.create(@fakeServer, {delay: 10, respond: true, afterResponse: ->})

    it "is called after successful response", ->
      handleAfterResponse = @sandbox.spy(@server, "handleAfterResponse")
      @server.stub url: /users/, response: {}, method: "GET", status: 201
      $.get("/users")

      ## tap into the promise
      @server.queue[0].then (xhr) =>
        expect(handleAfterResponse).to.be.calledWith xhr, {status: xhr.status, headers: xhr.responseHeaders, body: xhr.responseText}

    it "is called after 404 response", ->
      handleAfterResponse = @sandbox.spy(@server, "handleAfterResponse")
      $.get("/users")

      ## tap into the promise
      @server.queue[0].then (xhr) =>
        expect(handleAfterResponse).to.be.calledWith xhr, {status: 404, headers: {}, body: ""}

    it "pushes the response into server.responses", ->
      handleAfterResponse = @sandbox.spy(@server, "handleAfterResponse")
      @server.stub url: /users/, response: {}, method: "GET", status: 201
      $.get("/users")

      ## tap into the promise
      @server.queue[0].then (xhr) =>
        expect(@server.responses).to.have.length(1)
        expect(@server.responses[0]).to.deep.eq {status: 201, headers: {"Content-Type": "application/json"}, body: "{}"}

    it "calls afterResponse with request and request.matchedRoute", ->
      afterResponse = @sandbox.spy(@server, "afterResponse")
      @server.stub url: /users/, response: {}, method: "GET", status: 201
      $.get("/users")

      ## tap into the promise
      @server.queue[0].then (xhr) =>
        expect(afterResponse).to.be.calledWith xhr, xhr.matchedRoute

  context "#onError", ->
    beforeEach ->
      @fakeServer = @sandbox.useFakeServer()
      @server = $Cypress.Server.create(@fakeServer, {delay: 10, respond: true, onError: ->})

    it "invokes onError with matchedRoute", ->
      onError = @sandbox.spy @server, "onError"
      err = null
      @server.stub url: /users/, response: {}, method: "GET", status: 201

      ## cause an error related to the xhr
      $.get("/users").done ->
        try
          foo.bar()
        catch e
          err = e
          throw e

      @server.queue[0].then (xhr) =>
        expect(onError).to.be.calledWith xhr, xhr.matchedRoute, err

    it "invokes onError without matched route on 404", ->
      onError = @sandbox.spy @server, "onError"
      err = null

      ## cause an error related to the xhr
      $.get("/users").fail ->
        try
          foo.bar()
        catch e
          err = e
          throw e

      @server.queue[0].then (xhr) =>
        expect(onError).to.be.calledWith xhr, undefined, err

  context "#beforeRequest", ->
    beforeEach ->
      @fakeServer = @sandbox.useFakeServer()
      @server = $Cypress.Server.create(@fakeServer, {delay: 10, respond: true, beforeRequest: ->})

    it "invokes beforeRequest with matched route", (done) ->
      beforeRequest = @sandbox.spy(@server, "beforeRequest")
      @server.stub url: /users/, response: {}, method: "GET", status: 201
      @server.onRequest (xhr) ->
        expect(beforeRequest).to.be.calledWithMatch xhr, xhr.matchedRoute
        done()
      $.get("/users")

    it "invokes beforeRequest when 404", (done) ->
      beforeRequest = @sandbox.spy(@server, "beforeRequest")
      @server.onRequest (xhr) ->
        expect(beforeRequest).to.be.calledWithMatch xhr, undefined
        done()
      $.get("/users")

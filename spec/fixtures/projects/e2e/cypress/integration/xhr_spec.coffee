describe "xhrs", ->
  it "can encode + decode headers", ->
    getResp = ->
      {
        "test": "We’ll"
      }

    cy
      .server()
      .route(/api/, getResp()).as("getApi")
      .visit("/index.html")
      .window().then (win) ->
        xhr = new win.XMLHttpRequest
        xhr.open("GET", "/api/v1/foo/bar?a=42")
        xhr.send()
      .wait("@getApi")
        .its("url").should("include", "api/v1")

  it "ensures that request headers + body go out and reach the server unscathed", ->
    cy
      .visit("http://localhost:1919")
      .window().then (win) ->
        new Cypress.Promise (resolve) ->
          xhr = new win.XMLHttpRequest
          xhr.open("POST", "/login")
          xhr.setRequestHeader("Content-Type", "application/json")
          xhr.setRequestHeader("X-CSRF-Token", "abc-123")
          xhr.send(JSON.stringify({foo: "bar"}))
          xhr.onload = ->
            resolve(JSON.parse(xhr.response))
      .then (resp) ->
        ## the server sends us back response JSON
        ## with the request details so we can verify
        ## that the backend server received exactly what we sent
        ## and the Cypress proxy did not modify this in any way
        expect(resp.body).to.deep.eq({foo: "bar"})
        expect(resp.headers).to.have.property("x-csrf-token", "abc-123")
        expect(resp.headers).to.have.property("content-type", "application/json")

  it "does not inject into json's contents from http server even requesting text/html", ->
    cy
      .visit("http://localhost:1919")
      .window().then (win) ->
        new Cypress.Promise (resolve) ->
          xhr = new win.XMLHttpRequest
          xhr.open("POST", "/html")
          xhr.setRequestHeader("Content-Type", "text/html")
          xhr.setRequestHeader("Accept", "text/html")
          xhr.send(JSON.stringify({content: "<html>content</html>"}))
          xhr.onload = ->
            resolve(JSON.parse(xhr.response))
      .then (resp) ->
        ## even though our request is requesting text/html
        ## the server sends us back json and the proxy will
        ## not inject into json
        expect(resp).to.deep.eq({content: "<html>content</html>"})

  it "does not inject into json's contents from file server even requesting text/html", ->
    cy
      .visit("/")
      .window().then (win) ->
        new Cypress.Promise (resolve) ->
          xhr = new win.XMLHttpRequest
          xhr.open("GET", "/static/content.json")
          xhr.setRequestHeader("Content-Type", "text/html")
          xhr.setRequestHeader("Accept", "text/html")
          xhr.send()
          xhr.onload = ->
            resolve(JSON.parse(xhr.response))
      .then (resp) ->
        ## even though our request is requesting text/html
        ## the fil server sends us back json and the proxy will
        ## not inject into json
        expect(resp).to.deep.eq({content: "<html>content</html>"})

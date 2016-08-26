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
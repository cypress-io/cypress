shouldCloseUrlWithCode = (win, url, code) ->
  new Promise (resolve, reject) ->
    ws = new win.WebSocket(url)

    # ws.onerror = (err) ->
      # debugger

    ws.onclose = (evt) ->
      if evt.code is code
        resolve()
      else
        reject("websocket connection should have been closed with code #{code} for url: #{url} but was instead closed with code: #{evt.code}")

    ws.onopen = (evt) ->
      reject("websocket connection should not have opened for url: #{url}")

describe "websockets", ->
  it "does not crash", ->
    cy.visit("http://localhost:3038/foo")
    cy.log("should not crash on ECONNRESET websocket upgrade")
    cy.window().then (win) ->
      ## Firefox should close with code 1015 when using SSL, chrome should close with 1006
      ## see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      Cypress.Promise.all([
        shouldCloseUrlWithCode(win, "ws://localhost:3038/websocket", 1006)
        shouldCloseUrlWithCode(win, "wss://localhost:3040/websocket", if Cypress.browser.family is 'firefox' then 1015 else 1006)
      ])

    cy.log("should be able to send websocket messages")

    cy
    .window()
    .then (win) ->
      new Promise (resolve, reject) ->
        ws = new win.WebSocket("ws://localhost:3039/")
        ws.onmessage = (evt) ->
          resolve(evt.data)
        ws.onerror = reject
        ws.onopen = ->
          ws.send("foo")
    .should("eq", "foobar")

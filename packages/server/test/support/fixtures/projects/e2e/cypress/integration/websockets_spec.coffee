urlClosesWithCode1006 = (win, url) ->
  new Promise (resolve, reject) ->
    ws = new win.WebSocket(url)

    # ws.onerror = (err) ->
      # debugger

    ws.onclose = (evt) ->
      if evt.code is 1006
        resolve()
      else
        reject("websocket connection should have been closed with code 1006 for url: #{url} but was instead closed with code: #{evt.code}")

    ws.onopen = (evt) ->
      reject("websocket connection should not have opened for url: #{url}")

describe "websockets", ->
  it "does not crash", ->
    cy.visit("http://localhost:3838/foo")
    cy.log("should not crash on ECONNRESET websocket upgrade")
    cy.window().then { timeout: 10000 }, (win) ->
      Cypress.Promise.all([
        urlClosesWithCode1006(win, "ws://localhost:3838/websocket")
        urlClosesWithCode1006(win, "wss://localhost:3006/websocket")
      ])

    cy.log("should be able to send websocket messages")

    cy
    .window()
    .then { timeout: 10000 }, (win) ->
      new Promise (resolve, reject) ->
        ws = new win.WebSocket("ws://localhost:3939/")
        ws.onmessage = (evt) ->
          resolve(evt.data)
        ws.onerror = reject
        ws.onopen = ->
          ws.send("foo")
    .should("eq", "foobar")

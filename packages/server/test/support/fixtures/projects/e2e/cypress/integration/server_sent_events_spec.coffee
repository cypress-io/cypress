urlErrors = (win, url) ->
  new Promise (resolve, reject) ->
    es = new win.EventSource(url)

    es.onerror = (err) ->
      es.close()
      resolve()

    es.onopen = (evt) ->
      reject("event source connection should not have opened for url: #{url}")

describe "server sent events", ->
  it "does not crash", ->
    cy.visit("http://localhost:3038/foo")
    cy.window().then (win) ->
      Cypress.Promise.all([
        urlErrors(win, "http://localhost:3038/sse")
        urlErrors(win, "https://localhost:3040/sse")
      ])

    cy
    .log("should be able to receive server sent events")
    .window()
    .then (win) ->
      new Promise (resolve, reject) ->
        received = []

        es = new win.EventSource("http://127.0.0.1:3039/sse")
        es.onmessage = (evt) ->
          received.push(evt.data)

          if evt.data is "5"
            es.close()

            resolve(received)

        es.onerror = reject
    .should("deep.eq", ["1", "2", "3", "4", "5"])

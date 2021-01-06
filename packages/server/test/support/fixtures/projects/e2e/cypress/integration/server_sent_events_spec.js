urlErrors = (win, url) ->
  new Promise (resolve, reject) ->
    es = new win.EventSource(url)

    es.onerror = (err) ->
      es.close()
      resolve()

    es.onopen = (evt) ->
      reject("event source connection should not have opened for url: #{url}")

describe "server sent events", ->
  beforeEach ->
    cy.visit("http://localhost:3038/foo")

  it "does not crash", ->
    cy.window().then {timeout: 15000}, (win) ->
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

  it "aborts proxied connections to prevent client connection buildup", ->
    ## there shouldn't be any leftover connections either
    cy
    .request("http://localhost:3038/clients")
    .its("body").should("deep.eq", { clients: 0 })

    cy
    .window()
    .then (win) ->
      new Promise (resolve, reject) ->
        es = new win.EventSource("http://127.0.0.1:3039/sse")
        es.onopen = (evt) ->
          resolve(es)
        es.onerror = reject
    .then (es) ->
      cy
      .request("http://localhost:3038/clients")
      .its("body").should("deep.eq", { clients: 1 })
      .then ->
        es.close()
      .wait(100)
      .then ->
        cy
        .request("http://localhost:3038/clients")
        .its("body").should("deep.eq", { clients: 0 })

## https://github.com/cypress-io/cypress/issues/741
describe "zone.js", ->
  it "can serialize XHRs without blowing out the stack", ->
    cy
    .visit("/fixtures/zonejs.html")
    .window().then { timeout: 30000 }, (win) ->
      new Promise (resolve, reject) ->
        xhr = new win.XMLHttpRequest()

        xhr.open("HEAD", "/")
        xhr.send()

        xhr.onload = ->
          try
            Cypress.Log.toSerializedJSON(xhr)
            resolve()
          catch err
            reject(err)

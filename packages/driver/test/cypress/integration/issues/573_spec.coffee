run = ->
  cy.window()
  .then { timeout: 60000 }, (win) ->
    new Cypress.Promise (resolve) ->
      i = win.document.createElement("iframe")
      i.onload = resolve
      i.src = "/basic_auth"
      win.document.body.appendChild(i)
  .get("iframe").should ($iframe) ->
    expect($iframe.contents().text()).to.include("basic auth worked")
  .window().then { timeout: 60000 }, (win) ->
    new Cypress.Promise (resolve, reject) ->
      xhr = new win.XMLHttpRequest()
      xhr.open("GET", "/basic_auth")
      xhr.onload = ->
        try
          expect(@responseText).to.include("basic auth worked")
          resolve(win)
        catch err
          reject(err)
      xhr.send()
  .then { timeout: 60000 }, (win) ->
    new Cypress.Promise (resolve, reject) ->
      ## ensure other origins do not have auth headers attached
      xhr = new win.XMLHttpRequest()
      xhr.open("GET", "http://localhost:3501/basic_auth")
      xhr.onload = ->
        try
          expect(@status).to.eq(401)
          resolve(win)
        catch err
          reject(err)
      xhr.send()

# cy.visit("http://admin:admin@the-internet.herokuapp.com/basic_auth")

describe "basic auth", ->
  it "can visit with username/pw in url", ->
    cy.visit("http://cypress:password123@localhost:3500/basic_auth")
    run()

  it "can visit with auth options", ->
    cy.visit("http://localhost:3500/basic_auth", {
      auth: {
        username: "cypress"
        password: "password123"
      }
    })
    run()

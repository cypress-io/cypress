describe "server", ->
  it "passes event argument to xhr.onreadystatechange", (done) ->
    cy.window().then (win) ->
      xhr = new win.XMLHttpRequest()
      xhr.onreadystatechange = (e) ->
        expect(e).to.be.an.instanceof(win.Event)
        done()
      xhr.open("GET", "http://example.com")

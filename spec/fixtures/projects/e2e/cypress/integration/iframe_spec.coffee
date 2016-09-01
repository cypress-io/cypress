count        = 0
onBeforeLoad = Cypress.onBeforeLoad

Cypress.onBeforeLoad = ->
  count += 1

  onBeforeLoad.apply(@, arguments)

describe "iframes", ->
  it "can access nested iframes over http server", ->
    cy
      .visit("http://localhost:1616")
      .get("iframe").then ($iframe) ->
        h1 = $iframe.contents().find("h1")

        expect(h1.length).to.eq(1)

        expect($iframe.get(0).contentWindow.foo).to.eq("bar")

        ## onBeforeLoad should only be called once
        ## on the initial visit and not for the iframe
        expect(count).to.eq(1)

  it "can access iframes over file server", ->
    cy
      .visit("/outer.html")
      .get("iframe").then ($iframe) ->
        h1 = $iframe.contents().find("h1")

        expect(h1.length).to.eq(1)

        expect($iframe.get(0).contentWindow.foo).to.eq("bar")

        ## onBeforeLoad should only be called once
        ## on the initial visit and not for the iframe
        ##
        ## the reason this number is still 1 instead of 2
        ## is that when we visit back to <root> cypress will
        ## reload this spec thus nuking the state
        expect(count).to.eq(1)

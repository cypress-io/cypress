describe "issue #3121", ->
  it "shows anchor href content inside aut-iframe when target='aut-iframe'", ->
    cy
      .visit("/iframe_with_src.html")
      .get("iframe").then ($iframe) ->
        return cy
                .wrap($iframe.contents()
                .find('body'))
      .within ->
        cy
          .get("a")
          .click();

    cy
      .get("body").then ($body) ->
        expect($body).to.contain("hi")
      .get('iframe')
      .should('not.exist')
        

      
       
describe "issue #3121", ->
  it "shows anchor href content inside aut-iframe when target='aut-iframe'", ->
    cy
      .visit("http://localhost:3500/fixtures/issue_3121_iframe.html")
      .get("iframe").then ($iframe) ->
        return cy
                .wrap($iframe.contents()
                .find("body"))
      .within ->
        cy
          .get("a")
          .click();

    cy
      .get("body").then ($body) ->
        expect($body).to.contain("Some generic content")
      .get("iframe")
      .should("not.exist")

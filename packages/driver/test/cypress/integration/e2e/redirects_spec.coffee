describe "redirection", ->
  beforeEach ->
    @logs = []

    cy.on "log:added", (attrs, log) =>
      @logs.push(log)

    return null

  ## TODO: get this passing in chrome 76
  context.skip "meta", ->
    it "binds to the new page after a timeout", ->
      cy
        .visit("/fixtures/meta-redirect-timeout.html")
        .contains("timeout")
        .then ->
          ## visit, contains, page load, new url
          expect(@logs.length).to.eq(4)

          expect(@logs[0].get("name")).to.eq("visit")
          expect(@logs[1].get("name")).to.eq("contains")
          expect(@logs[2].get("name")).to.eq("page load")
          expect(@logs[3].get("name")).to.eq("new url")

    it "binds to the new page on immediate refresh", ->
      cy
        .visit("/fixtures/meta-redirect.html")
        .get("a:first")
        .then ->
          ## visit, get, page load, new url
          expect(@logs.length).to.eq(4)

          expect(@logs[0].get("name")).to.eq("visit")
          expect(@logs[1].get("name")).to.eq("get")
          expect(@logs[2].get("name")).to.eq("page load")
          expect(@logs[3].get("name")).to.eq("new url")

  context "javascript", ->
    ## FIREFOX FIXME: logs doesn't include "page load"
    it "binds to the new page after a timeout", ->
      cy
        .visit("/fixtures/js-redirect-timeout.html")
        .contains("timeout")
        .then ->
          ## visit, contains, page load, new url
          expect(@logs.length).to.eq(4)

          expect(@logs[0].get("name")).to.eq("visit")
          expect(@logs[1].get("name")).to.eq("contains")
          expect(@logs[2].get("name")).to.eq("page load")
          expect(@logs[3].get("name")).to.eq("new url")

    ## FIREFOX FIXME: logs doesn't include "page load"
    it "binds to the new page on immediate refresh", ->
      cy
        .visit("/fixtures/js-redirect.html")
        .get("a:first")
        .then ->
          ## visit, get, page load, new url
          expect(@logs.length).to.eq(4)

          expect(@logs[0].get("name")).to.eq("visit")
          expect(@logs[1].get("name")).to.eq("get")
          expect(@logs[2].get("name")).to.eq("page load")
          expect(@logs[3].get("name")).to.eq("new url")

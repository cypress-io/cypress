describe "$Cypress.Cy Commands", ->
  enterCommandTestingMode()

  it "can invoke commands by name", ->
    body = @cy.$("body")

    @cy
      .get("body").then ($body) ->
        expect($body.get(0)).to.eq(body.get(0))
      .cmd("get", "body").then ($body) ->
        expect($body.get(0)).to.eq(body.get(0))

  it "can invoke child commands by name", ->
    div = @cy.$("body>div:first")

    @cy
      .get("body").find("div:first").then ($div) ->
        expect($div.get(0)).to.eq(div.get(0))
      .get("body").cmd("find", "div:first").then ($div) ->
        expect($div.get(0)).to.eq(div.get(0))

  it "does not add cmds to cy.commands queue", ->
    @cy.cmd("get", "body").then ->
      names = @cy.commands.names()
      expect(names).to.deep.eq(["get", "then", "then"])

  context "custom commands", ->
    beforeEach ->
      @Cypress.addParentCommand "dashboard.selectRenderer", =>
        @cy
          .chain()
          .get("[contenteditable]")
          .first()

      @Cypress.addChildCommand "login", (subject, email) =>
        @cy
          .chain()
          .wrap(subject.find("input:first"))
          .type(email)

    it "works with custom commands", ->
      input = @cy.$("input:first")

      @cy
        .get("input:first")
        .parent()
        .cmd("login", "brian@foo.com").then ($input) ->
          expect($input.get(0)).to.eq(input.get(0))

    it "works with namespaced commands", ->
      ce = @cy.$("[contenteditable]").first()

      @cy
        .command("dashboard.selectRenderer").then ($ce) ->
          expect($ce.get(0)).to.eq(ce.get(0))

  describe "errors", ->
    beforeEach ->
      @allowErrors()

    it "throws when cannot find command by name", ->
      try
        @cy.get("body").cmd("foo", "bar", "baz")
      catch err
        cmds = _.keys(@Cypress.Chainer.prototype)
        expect(cmds.length).to.be.gt(1)
        expect(err.message).to.eq("Could not find a command for: 'foo'.\n\nAvailable commands are: #{cmds.join(", ")}.\n")
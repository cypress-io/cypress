describe "src/cy/commands/popups", ->
  context "alert", ->
    beforeEach ->
      cy.visit("/fixtures/generic.html")

      @logs = []

      cy.on "log:added", (attrs, log) =>
        if attrs.name is "alert"
          @logs.push(log)

      return null

    it "logs the alert", ->
      cy.window().then (win) ->
        win.alert("fooooo")
      .then ->
        expect(@logs.length).to.eq(1)
        expect(@logs[0].get("name")).to.eq("alert")
        expect(@logs[0].get("message")).to.eq("fooooo")

        consoleProps = @logs[0].invoke("consoleProps")

        expect(consoleProps).to.deep.eq({
          Event: "alert"
          Alerted: "fooooo"
        })

  context "confirm", ->
    beforeEach ->
      cy.visit("/fixtures/generic.html")

      @logs = []

      cy.on "log:added", (attrs, log) =>
        if attrs.name is "confirm"
          @logs.push(log)

      return null

    it "logs the confirm", ->
      cy.window().then (win) ->
        win.confirm("Delete hard drive?")
      .then ->
        expect(@logs.length).to.eq(1)
        expect(@logs[0].get("name")).to.eq("confirm")
        expect(@logs[0].get("message")).to.eq("Delete hard drive?")

        consoleProps = @logs[0].invoke("consoleProps")

        expect(consoleProps).to.deep.eq({
          Event: "confirm"
          Prompted: "Delete hard drive?"
          Confirmed: true
        })

    it "can turn on and off confirmation", ->
      cy.on "window:confirm", (str) ->
        switch str
          when "foo" then false
          when "bar" then true
          when "baz" then undefined

      cy.window().then (win) ->
        confirmedFoo = win.confirm("foo")
        expect(confirmedFoo).to.be.false

        confirmedBar = win.confirm("bar")
        expect(confirmedBar).to.be.true

        ## undefined is not strictly false
        ## so the confirmation should be true
        confirmedBaz = win.confirm("baz")
        expect(confirmedBaz).to.be.true

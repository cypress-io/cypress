describe "Cypress ID Generator", ->
  enterCommandTestingMode("html/id_generator")

  context "html/id_generator", ->
    it "is valid id_generator.js", (done) ->
      @cy.window().then (win) ->
        win.onerror = done

        onSpy = @sandbox.spy()

        win.io = {
          connect: =>
            {on: onSpy }
        }

        connect = @sandbox.spy(win.io, "connect")

        win.$.getScript("/lib/public/js/id_generator.js")
          .fail (jqXhr, settings, err) ->
            done(err)

          .done ->
            expect(connect).to.be.calledOnce
            expect(onSpy).to.be.calledWith "generate:ids:for:test"
            done()

        null

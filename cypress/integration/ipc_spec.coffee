describe "App Ipc", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

  context "#off", ->
    it "removes queued messages by event name", ->
      @App.ipc("foo:bar:baz", ->)

      getEvent = =>
        msgs = @App.ipc()

        Cypress._.find msgs, (msg) ->
          msg.event is "foo:bar:baz"

      expect(getEvent()).to.be.ok

      @App.ipc.off("foo:bar:baz")

      expect(getEvent()).to.be.undefined

  context "#offById", ->
    it "can remove queued messages by its id", ->
      @App.ipc("foo:bar:baz", ->)

      getId = =>
        msgs = @App.ipc()

        for id, msg of msgs
          if msg.event is "foo:bar:baz"
            return id

      id = getId()

      expect(id).to.be.ok

      @App.ipc.offById(id)

      expect(getId()).to.be.undefined

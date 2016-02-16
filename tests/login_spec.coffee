describe "Login [000]", ->
  beforeEach ->
    cy.visit("/", {
      onBeforeLoad: (contentWindow) =>
        contentWindow.ipc = @ipc = {
          on:   ->
          send: ->
        }

        # agents = cy.agents()


        # ipc.on = (event, cb) ->
          # if event is "get:options"

        # agents.stub(ipc, "on").withArgs("response").yields("get:options", {})
    })

  it "foos [001]", ->
    debugger
    @ipc.emit("response", "get:options", {})
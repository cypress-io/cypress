## attach to Cypress global

Cypress.Server = do (Cypress, _) ->

  class Server

  Cypress.server = (options) ->
    new Server(options)

  return Server
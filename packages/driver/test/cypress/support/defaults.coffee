_ = Cypress._
$ = Cypress.$

## backup the original config
ORIG_CONFIG = _.clone(Cypress.config())

beforeEach ->
  ## restore it before each test
  Cypress.config(ORIG_CONFIG)

  ## remove all event listeners
  ## from the window
  $(cy.state("window")).off()

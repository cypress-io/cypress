_ = Cypress._

## backup the original config
ORIG_CONFIG = _.clone(Cypress.config())

beforeEach ->
  ## restore it before each test
  Cypress.config(ORIG_CONFIG)

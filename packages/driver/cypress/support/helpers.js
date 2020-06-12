const { _ } = Cypress

const getFirstSubjectByName = (name) => {
  return cy.queue.find({ name }).get('subject')
}

const getQueueNames = () => {
  return _.map(cy.queue, 'name')
}

const registerCypressConfigBackupRestore = () => {
  let originalConfig

  beforeEach(() => {
    originalConfig = _.clone(Cypress.config())
  })

  afterEach(() => {
    Cypress.config(originalConfig)
  })
}

module.exports = {
  getQueueNames,
  getFirstSubjectByName,
  registerCypressConfigBackupRestore,
}

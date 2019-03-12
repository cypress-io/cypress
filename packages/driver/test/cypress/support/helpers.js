const { _ } = Cypress

const getFirstSubjectByName = (name) => {
  return cy.queue.find({ name }).get('subject')
}

const getQueueNames = () => {
  return _.map(cy.queue, 'name')
}

module.exports = {
  getQueueNames,

  getFirstSubjectByName,
}

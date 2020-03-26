_ = Cypress._

getFirstSubjectByName = (name) ->
  cy.queue.find({name: name}).get("subject")

getQueueNames = ->
  _.map(cy.queue, "name")

module.exports = {
  getQueueNames

  getFirstSubjectByName
}

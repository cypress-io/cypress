// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  _,
} = Cypress

const getFirstSubjectByName = (name) => cy.queue.find({ name }).get('subject')

const getQueueNames = () => _.map(cy.queue, 'name')

module.exports = {
  getQueueNames,

  getFirstSubjectByName,
}

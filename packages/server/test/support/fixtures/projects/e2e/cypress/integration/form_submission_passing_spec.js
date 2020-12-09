/* eslint-disable
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('form submissions', () => {
  beforeEach(() => {
    return cy.visit('/forms.html')
  })

  it('will find \'form success\' message by default (after retrying)', () => {
    return cy
    .server()
    .route('POST', '/users', {})
    .get('input[name=name]').type('brian')
    .get('#submit').click()
    .get('form span').then(($span) => {
      expect($span).to.contain('form success!')
    })
  })

  it('needs an explicit should when an element is immediately found', () => {
    return cy
    .server()
    .route('POST', '/users', {})
    .get('input[name=name]').type('brian')
    .get('#submit').click()
    .get('form').should(($form) => {
      expect($form).to.contain('form success!')
    })
  })
})

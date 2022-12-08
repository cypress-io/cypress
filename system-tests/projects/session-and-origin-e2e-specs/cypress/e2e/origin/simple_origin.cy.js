// NOTE: DO NOT REMOVE THE COMMENT BELOW. It is used to test cy.origin under hot reload to make sure everything works as expected
// REPLACE THIS COMMENT FOR HOT RELOAD
describe('simple origin', () => {
  it('passes', () => {
    cy.origin('http://foobar:4455', () => {
      cy.log('log me once')
      cy.log('log me twice')
    })
  })
})

// NOTE: dynamic imports like this work in example projects, but not inside this repo
// probably due to webpack plugins not set up correctly ☹️
// https://github.com/bahmutov/cypress-react-unit-test/issues/136
describe.skip('dynamic import', () => {
  it('loads', () => {
    // cy.wrap(import('./lazy-add'))
  })
})

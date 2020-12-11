/* eslint-disable
    mocha/no-global-tests,
    no-undef
*/
it('nests the file based on spec path', () => {
  cy.screenshot({ capture: 'runner' })
  cy.readFile('cypress/screenshots/nested-1/nested-2/screenshot_nested_file_spec.js/nests the file based on spec path.png', 'base64')
})

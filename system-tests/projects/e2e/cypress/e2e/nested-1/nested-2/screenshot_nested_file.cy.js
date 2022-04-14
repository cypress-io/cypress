/* eslint-disable
    mocha/no-global-tests,
    no-undef
*/
it('nests the file based on spec path', () => {
  cy.screenshot({ capture: 'runner' })
  cy.readFile('cypress/screenshots/screenshot_nested_file.cy.js/nests the file based on spec path.png', 'base64')
})

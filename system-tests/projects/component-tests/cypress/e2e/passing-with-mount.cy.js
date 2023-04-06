it('should pass with component mount registered', () => {
  // "cy.visit" is disabled when component testing due to a side effect of "import { mount } from 'cypress/{react,vue}'"
  // These side effects have been disabled when testingType === 'e2e' so this will now pass.
  cy.visit('./index.html')
  cy.contains('h1', 'Hello World')
})

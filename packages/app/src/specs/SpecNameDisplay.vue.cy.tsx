import SpecNameDisplay from './SpecNameDisplay.vue'

describe('<SpecNameDisplay />', () => {
  it('should display spec name information', () => {
    cy.mount(<SpecNameDisplay specFileName="myFileName" specFileExtension=".cy.tsx" />)

    cy.findByText('myFileName').should('be.visible')
    cy.findByText('.cy.tsx').should('be.visible')

    cy.findByTestId('spec-filename').should('have.attr', 'title', 'myFileName.cy.tsx')
  })
})

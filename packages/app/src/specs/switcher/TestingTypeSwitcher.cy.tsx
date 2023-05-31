import TestingTypeSwitcher from './TestingTypeSwitcher.vue'

describe('<TestingTypeSwitcher />', () => {
  beforeEach(() => {
    const stub = cy.stub().as('selectTestingType')

    cy.mount(<TestingTypeSwitcher
      viewedTestingType="e2e"
      isCtConfigured
      isE2eConfigured={false}
      onSelectTestingType={stub}
    />)
  })

  it('renders', () => {
    cy.percySnapshot()
  })

  it('displays question mark for unconfigured testing type', () => {
    cy.findByTestId('unconfigured-icon').should('be.visible')
  })

  it('emits event on switch', () => {
    cy.findByText('Component specs').click()
    cy.get('@selectTestingType').should('have.been.calledOnceWith', 'component')
  })
})

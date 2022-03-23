import Spinner from './Spinner.vue'

describe('<Spinner />', { viewportHeight: 200, viewportWidth: 200 }, () => {
  it('renders', () => {
    cy.mount(() => (
      <Spinner />
    ))

    cy.percySnapshot()
  })
})

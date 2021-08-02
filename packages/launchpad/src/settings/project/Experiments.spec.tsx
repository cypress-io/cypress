import Experiments from './Experiments.vue'
import { experiments as defaultExperiments } from './projectSettings'

const experiments = [defaultExperiments[0]]
describe('<Experiments />', () => {
  beforeEach(() => {
    cy.viewport(800, 600)
  })

  it('renders experiments that are passed in', () => {
    cy.mount(() => (
      <div class="py-4 px-8">
        <Experiments experiments={experiments}/>
      </div>
    ))

    cy.findByText(experiments[0].name).should('be.visible')
    cy.findByText(experiments[0].key).should('be.visible')
  })

  it('fetches its own experiments', () => {
    cy.mount(() => (
      <div class="py-4 px-8">
        <Experiments />
      </div>
    ))

    cy.get('[data-testid="experiment"]').should('have.length.gt', 0)
  })
})

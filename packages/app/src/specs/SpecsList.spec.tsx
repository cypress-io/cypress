import { randomComponents } from '../../cypress/support/fixtures'
import SpecsList from './SpecsList.vue'

const specs = randomComponents(100)
describe('<SpecsList />', () => {
  it('renders', () => {
    cy.mount(<SpecsList specs={specs} />)
  })
})

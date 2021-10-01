import { randomComponents } from '../../cypress/support/fixtures'
import SpecsList from './SpecsList.vue'
import { SpecsList_SpecsFragmentDoc } from '../generated/graphql-test'

const specs = randomComponents(100)
describe('<SpecsList />', () => {
  it('renders', () => {
    cy.mountFragment(SpecsList_SpecsFragmentDoc, {
      render: (gqlVal) => {
        return <SpecsList gql={gqlVal} />
      },
      type: (ctx) => {
        return ctx.stubApp
      }
    }).then(() => {
    })
  })
})

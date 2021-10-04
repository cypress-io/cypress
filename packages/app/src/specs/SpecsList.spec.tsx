import SpecsList from './SpecsList.vue'
import { SpecsListFragmentDoc } from '../generated/graphql-test'

describe('<SpecsList />', () => {
  it('renders', () => {
    cy.mountFragment(SpecsListFragmentDoc, {
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

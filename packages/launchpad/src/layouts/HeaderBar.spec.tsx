import { HeaderBarFragmentDoc } from '../generated/graphql-test'
import HeaderBar from './HeaderBar.vue'

describe('<HeaderBar />', () => {
  it('renders a long list of found browsers correctly', () => {
    cy.viewport(1000, 750)
    cy.mountFragment(HeaderBarFragmentDoc, {
      type: (ctx) => {
        return {
          ...ctx.stubQuery,
        }
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBar gql={gqlVal} show-browsers={true} /></div>,
    })

    // no selected browser so launch buttun should not exist
    cy.pause()
  })
})

import { ConvertConfigFileFragmentDoc } from '../generated/graphql-test'
import ConvertConfigFile from './ConvertConfigFile.vue'

describe('<ConvertConfigFile/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mountFragment(ConvertConfigFileFragmentDoc, {
      render (gql) {
        return (<div class="p-16px">
          <ConvertConfigFile gql={gql} />
        </div>)
      },
    })
  })
})

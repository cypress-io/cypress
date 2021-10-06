import { PackagesListFragmentDoc } from '../generated/graphql-test'
import PackagesList from './PackagesList.vue'

describe('<PackagesList />', () => {
  it('playground', () => {
    cy.mountFragment(PackagesListFragmentDoc, {
      render: (gqlVal) => <PackagesList gql={gqlVal} />,
    })
  })
})

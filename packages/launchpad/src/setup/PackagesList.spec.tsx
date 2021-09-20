import { PackagesListFragmentDoc } from '../generated/graphql-test'
import PackagesList from './PackagesList.vue'

describe('<PackagesList />', () => {
  it('playground', () => {
    cy.mountFragment(PackagesListFragmentDoc, {
      type: (ctx) => ctx.wizard,
      render: (gqlVal) => <PackagesList gql={gqlVal} />,
    })
  })
})

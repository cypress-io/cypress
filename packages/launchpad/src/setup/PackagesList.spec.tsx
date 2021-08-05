import { PackagesListFragmentDoc } from '../generated/graphql'
import PackagesList from './PackagesList.vue'

describe('<PackagesList />', () => {
  it('playground', () => {
    cy.mountFragment(PackagesListFragmentDoc, {
      type: (ctx) => ctx.wizard,
      render: (gqlVal) => <PackagesList gql={gqlVal} />,
    })
  })
})

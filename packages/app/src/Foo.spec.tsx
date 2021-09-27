import { FooFragmentDoc } from './generated/graphql-test'
import Foo from './Foo.vue'

describe('Foo', () => {
  it('renders something', () => {
    cy.mountFragment(FooFragmentDoc, {
      render: (gqlVal) => {
        return <Foo gql={gqlVal} />
      },
    }).then(() => {
      cy.get('h3').contains('OK')
    })
  })
})

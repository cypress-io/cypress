import { FooFragmentDoc } from './generated/graphql-test'
import Foo from './Foo.vue'

describe('Foo', () => {
  it('renders something', () => {
    cy.mountFragment(FooFragmentDoc, {
      onResult: (ctx) => {
        return ctx
      },
      render: (gqlVal) => {
        return <Foo gql={gqlVal} />
      },
    }).then(() => {
      cy.get('h3').contains('OK')
    })
  })
})

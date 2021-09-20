import { FooFragmentDoc } from './generated/graphql-test'
import Foo from './Foo.vue'
import { Query } from '@packages/graphql'

describe('Foo', () => {
  it('renders something', () => {
    cy.mountFragment(FooFragmentDoc, {
      type: (ctx) => new Query(ctx),
      render: (gqlVal) => {
        return <Foo gql={gqlVal} />
      },
    }).then(() => {
      cy.get('h3').contains('OK')
    })
  })
})

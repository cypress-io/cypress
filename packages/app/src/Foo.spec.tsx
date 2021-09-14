import { FooFragmentDoc } from './generated/graphql'
import Foo from './Foo.vue'

describe('Foo', () => {
  it('renders something', () => {
    cy.mountFragment(FooFragmentDoc, {
      type: (ctx) => {
        return ctx.app
      },
      render: (gqlVal) => {
        return <Foo gql={gqlVal} />
      },
    }).then(() => {
      cy.get('h3').contains('OK')
    })
  })
})

import { OpenBrowserListFragmentDoc } from '../generated/graphql'
import OpenBrowserList from './OpenBrowserList.vue'
import longBrowserList from '../../cypress/fixtures/browsers/long-list.json'

describe('<OpenBrowserList />', () => {
  it('playground', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      type: (ctx) => {
        ctx.app.setBrowsers(longBrowserList)

        return ctx.app
      },
      render: (gqlVal) => <OpenBrowserList gql={gqlVal} />,
    })
  })
})

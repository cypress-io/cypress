import { OpenBrowserListFragmentDoc } from '../generated/graphql'
import OpenBrowserList from './OpenBrowserList.vue'

describe('<OpenBrowserList />', () => {
  it('playground', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      type: (ctx) => {
        ctx.app.setBrowsers([
          {
            'name': 'chrome',
            'family': 'chromium',
            'channel': 'stable',
            'displayName': 'Chrome',
            'path': '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            'version': '93.0.4577.63',
            'majorVersion': '93',
          },
          {
            'name': 'electron',
            'family': 'chromium',
            'channel': 'stable',
            'displayName': 'Electron',
            'path': '',
            'version': '91.0.4472.164',
            'majorVersion': '91',
          },
        ])

        return ctx.app
      },
      render: (gqlVal) => <OpenBrowserList gql={gqlVal} />,
    })
  })
})

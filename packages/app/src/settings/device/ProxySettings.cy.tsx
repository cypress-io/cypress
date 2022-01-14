import { ProxySettingsFragmentDoc } from '../../generated/graphql-test'
import ProxySettings from './ProxySettings.vue'

describe('<ProxySettings />', {
  viewportHeight: 400,
  viewportWidth: 600,
}, () => {
  it('renders', () => {
    cy.mountFragment(ProxySettingsFragmentDoc, {
      onResult: (ctx) => {
        ctx.localSettings.preferences.proxyServer = 'proxy-server'
        ctx.localSettings.preferences.proxyBypass = 'proxy-bypass'
      },
      render: (gql) => <div class="p-24px"><ProxySettings gql={gql} /></div>,
    })

    cy.findByText('Proxy Bypass List')
    .get('[data-testid=bypass-list]').should('have.text', 'proxy-bypass')

    cy.findByText('Proxy Server')
    .get('[data-testid=proxy-server]').should('have.text', 'proxy-server')

    cy.percySnapshot()
  })

  it('renders empty', () => {
    cy.mountFragment(ProxySettingsFragmentDoc, {
      render: (gql) => <div class="p-24px"><ProxySettings gql={gql} /></div>,
    })

    cy.findByText('Proxy Bypass List')
    .get('[data-testid=bypass-list]').should('have.text', '-')

    cy.findByText('Proxy Server')
    .get('[data-testid=proxy-server]').should('have.text', '-')
  })
})

import { ProxySettingsFragmentDoc } from '../../generated/graphql-test'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
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
      render: (gql) => <div class="p-[24px]"><ProxySettings gql={gql} /></div>,
    })

    cy.contains('h2', 'Proxy settings')
    cy.contains('p', 'Cypress auto-detected the following proxy settings from your operating system.')
    cy.findByText('Proxy bypass list')
    .get('[data-testid=bypass-list]').should('have.text', 'proxy-bypass')

    cy.findByText('Proxy server')
    .get('[data-testid=proxy-server]').should('have.text', 'proxy-server')
  })

  it('renders the title and description', () => {
    const proxySection = defaultMessages.settingsPage.proxy

    cy.mountFragment(ProxySettingsFragmentDoc, {
      render: (gql) => <div class="p-[24px]"><ProxySettings gql={gql} /></div>,
    })

    cy.findByText(proxySection.description).should('be.visible')
    cy.findByText(proxySection.title).should('be.visible')
  })

  it('renders empty', () => {
    cy.mountFragment(ProxySettingsFragmentDoc, {
      render: (gql) => <div class="p-[24px]"><ProxySettings gql={gql} /></div>,
    })

    cy.findByText('Proxy bypass list')
    .get('[data-testid=bypass-list]').should('have.text', '-')

    cy.findByText('Proxy server')
    .get('[data-testid=proxy-server]').should('have.text', '-')
  })
})

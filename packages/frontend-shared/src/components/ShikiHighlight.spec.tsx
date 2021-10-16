import ShikiHighlight from './ShikiHighlight.vue'
import code from '../../windi.config?raw'

const devServerCode = `
const { defineConfig } = require(’cypress’)
const { devServer, defineDevServerConfig } = require(’@cypress/vite-dev-server’)

module.exports = defineConfig({
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({
      entryHtmlFile: 'cypress/component/support/entry.html'
    }),
  },
})
`

describe('<ShikiHighlight/>', () => {
  it('playground', () => {
    cy.mount(() => <ShikiHighlight code={devServerCode} lang="js" />)
  })

  it('render the code', () => {
    cy.mount(() => <ShikiHighlight code={code} lang="ts" />)
    cy.get('.shiki').should('be.visible')
  })

  it('show line numbers', () => {
    cy.mount(() => <ShikiHighlight code={code} lang="ts" lineNumbers />)
    cy.get('.shiki').should('be.visible')
  })

  it('display inline', () => {
    cy.mount(() => <ShikiHighlight code={code} lang="ts" inline />)
    cy.get('.shiki').should('be.visible')
  })
})

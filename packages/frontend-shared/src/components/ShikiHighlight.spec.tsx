import ShikiHighlight, { initHighlighter } from './ShikiHighlight.vue'
import code from '../../windi.config?raw'

const devServerCode = `const { defineConfig } = require(’cypress’)
const { devServer, defineDevServerConfig } = require(’@cypress/vite-dev-server’)

module.exports = defineConfig({
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({
      entryHtmlFile: 'cypress/component/support/entry.html'
    }),
  },
})`

describe('<ShikiHighlight/>', { viewportWidth: 1300, viewportHeight: 1300 }, () => {
  beforeEach(async () => {
    await initHighlighter()
  })

  it('playground', () => {
    cy.mount(() => <ShikiHighlight code={devServerCode} lang="js" lineNumbers />)
  })

  it('render the code without arguments', () => {
    cy.mount(() => <ShikiHighlight code={code} lang="ts" />)
    cy.get('.shiki').should('be.visible')
  })

  it('show line numbers when the prop is passed', () => {
    cy.mount(() => <ShikiHighlight code={code} lang="ts" lineNumbers />)
    cy.get('.shiki').should('be.visible')
  })

  it('display inline and remove some of the padding when "inline"', { viewportWidth: 300, viewportHeight: 100 }, () => {
    cy.mount(() => <ShikiHighlight code={'project: xv123456'} lang="yaml" inline />)
    cy.get('.shiki').should('be.visible')
  })
})

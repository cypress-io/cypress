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
    cy.mount(() => (<div class="p-12">
      <ShikiHighlight code={devServerCode} lang="js" lineNumbers />
    </div>))
  })

  it('trims whitespace to show the correct number of lines', () => {
    const line = `console.log('my string')`
    const numLines = 15

    // Whitespace
    // eslint-disable-next-line
    const code = `
    

      ${Array.from(Array(numLines).keys()).map(() => line).join('\n')}
    

    `

    cy.mount(() => (<div class="p-12">
      <ShikiHighlight code={code} lang="js" lineNumbers />
    </div>))
    .get('.line')
    .should('have.length', numLines)
  })

  it('wraps long code without line numbers', () => {
    cy.mount(() => <div class="p-12"><ShikiHighlight wrap code={code} lang="ts" /></div>)
    cy.get('.shiki').should('be.visible')
  })

  it('wraps long code with line numbers', () => {
    cy.mount(() => <div class="p-12"><ShikiHighlight lineNumbers wrap code={code} lang="ts" /></div>)
    cy.get('.shiki').should('be.visible')
  })

  it('render the code without arguments', () => {
    cy.mount(() => <div class="p-12"><ShikiHighlight code={code} lang="ts" /></div>)
    cy.get('.shiki').should('be.visible')
  })

  it('display inline and remove some of the padding when "inline"', { viewportWidth: 300, viewportHeight: 100 }, () => {
    cy.mount(() => <ShikiHighlight code={'project: xv123456'} lang="yaml" inline />)
    cy.get('.shiki').should('be.visible')
  })

  it('show line numbers when the prop is passed', () => {
    cy.mount(() => <div class="p-12"><ShikiHighlight code={code} lang="ts" lineNumbers /></div>)
    cy.get('.shiki').should('be.visible')
  })
})

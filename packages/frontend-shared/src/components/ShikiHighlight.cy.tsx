import ShikiHighlight, { initHighlighter } from './ShikiHighlight.vue'
import code from '../../windi.config?raw'

const devServerCode = `const { defineConfig } = require('cypress')
const { devServer } = require('@cypress/vite-dev-server')

module.exports = defineConfig({
  component: {
    devServer,
    devServerConfig: {
      entryHtmlFile: 'cypress/component/support/entry.html'
    },
  },
})`

describe('<ShikiHighlight/>', { viewportWidth: 800, viewportHeight: 500 }, () => {
  beforeEach(async () => {
    initHighlighter()
  })

  it('playground', () => {
    cy.mount(() => (<div class="p-12">
      <ShikiHighlight code={devServerCode} lang="js" lineNumbers />
    </div>))

    cy.contains(devServerCode).should('be.visible')
    cy.percySnapshot()
  })

  it('trims whitespace to show the correct number of lines', { viewportWidth: 500, viewportHeight: 500 }, () => {
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

    cy.percySnapshot()
  })

  // TODO: (UNIFY-921) unskip when `wrap` prop is needed and working (currently used nowhere)
  it.skip('wraps long code without line numbers', { viewportWidth: 900, viewportHeight: 500 }, () => {
    cy.mount(() => <div class="w-full p-12"><ShikiHighlight wrap code={code} lang="ts" /></div>)
    cy.get('.shiki').should('be.visible')
  })

  // TODO: (UNIFY-921) unskip when `wrap` prop is needed and working (currently used nowhere)
  it.skip('wraps long code with line numbers', () => {
    cy.mount(() => <div class="p-12"><ShikiHighlight lineNumbers wrap code={code} lang="ts" /></div>)
    cy.get('.shiki').should('be.visible')
  })

  it('render the code without arguments', () => {
    cy.mount(() => <div class="p-12"><ShikiHighlight code={code} lang="ts" /></div>)
    cy.get('.shiki').should('be.visible')
    cy.percySnapshot()
  })

  it('display inline and remove some of the padding when "inline"', { viewportWidth: 300, viewportHeight: 100 }, () => {
    cy.mount(() => <ShikiHighlight code={'project: xv123456'} lang="yaml" inline />)
    cy.get('.shiki').should('be.visible')
    cy.percySnapshot()
  })

  it('show line numbers when the prop is passed', () => {
    cy.mount(() => <div class="p-12"><ShikiHighlight code={code} lang="ts" lineNumbers /></div>)
    cy.get('.shiki').should('be.visible')
    cy.percySnapshot()
  })
})

import ShikiHighlight from './ShikiHighlight.vue'
import { initHighlighter } from './highlight'

const code = `// This is sample code to test with the Shiki Highlight component

const MY_VALUE = 'sample text'

/**
 * This is a sample function
 */
const myFunction = (val) => {
  return val
}

module.exports = {
  sample: 'text',
  other_sample: 123,
  myFunction,
  exportedConstant: MY_VALUE,
}`

const devServerCode = `const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    devServer: {
      bundler: 'vite',
      framework: 'vue',
    },
    indexHtmlFile: 'cypress/component/support/entry.html'
  },
})`

describe('<ShikiHighlight/>', { viewportWidth: 800, viewportHeight: 500 }, () => {
  beforeEach(async () => {
    await initHighlighter()
  })

  it('playground', () => {
    cy.mount(() => (<div class="p-12">
      <ShikiHighlight code={devServerCode} lang="js" lineNumbers />
    </div>))

    cy.contains(devServerCode).should('be.visible')
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
    cy.contains(code)
    cy.percySnapshot()
  })

  it('show line numbers when the prop is passed', () => {
    cy.mount(() => <div class="p-12"><ShikiHighlight code={code} lang="ts" lineNumbers /></div>)
    cy.get('.shiki').should('be.visible')
    cy.contains(code)
    cy.percySnapshot()
  })

  it('show line numbers with initial line when the prop is passed', () => {
    cy.mount(() => <div class="p-12"><ShikiHighlight code={code} lang="ts" lineNumbers initialLine={10} /></div>)
    cy.get('.shiki').should('be.visible')
    cy.contains(code)
    cy.percySnapshot()
  })

  describe('copy button', () => {
    it('should not render when specified "false"', () => {
      cy.mount(() => <div class="p-12"><ShikiHighlight code={code} lang="ts" copyButton={false} /></div>)
      cy.get('button').should('not.exist')
    })

    it('should render when specified "true"', () => {
      cy.mount(() => <div class="p-12"><ShikiHighlight code={code} lang="ts" copyButton={true} /></div>)
      cy.get('button').should('be.visible')
      cy.contains(code)
    })

    it('should remain visible when content becomes scrollable', () => {
      cy.mount(() => <div class="h-10 p-12"><ShikiHighlight code={code.repeat(5)} lang="ts" copyButton={true} /></div>)
      cy.get('button').validateWithinViewport()

      cy.scrollTo('bottom', { duration: 100 })
      .get('button')
      .validateWithinViewport()

      cy.scrollTo('top', { duration: 100 })
      .get('button')
      .validateWithinViewport()

      cy.contains(code)
    })
  })
})

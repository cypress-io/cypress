import ShikiHighlight from './ShikiHighlight.vue'
import code from '../../windi.config?raw'

describe('<ShikiHighlight/>', () => {
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

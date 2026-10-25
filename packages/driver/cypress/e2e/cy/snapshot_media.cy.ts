import { create } from '../../../src/cy/snapshots_css'
import { createSnapshotStyle } from '../../../../app/src/runner/snapshot-styles'

describe('snapshot stylesheet media restoration', () => {
  for (const width of [500, 900]) {
    it(`captures and restores media conditions at a ${width}px viewport`, () => {
      cy.viewport(width, 600)
      cy.visit('/fixtures/empty.html')
      cy.document().then((doc) => {
        doc.body.innerHTML = '<p class="foo">snapshot media</p>'
        const style = doc.createElement('style')

        style.media = '(max-width: 600px)'
        style.textContent = '.foo { color: rgb(255, 0, 0); }'
        doc.head.appendChild(style)
        const mixed = doc.createElement('style')

        mixed.media = 'print, screen'
        mixed.textContent = '.foo { border-left: 7px solid; }'
        doc.head.appendChild(mixed)
        const print = doc.createElement('style')

        print.media = 'print'
        print.textContent = '.foo { display: none; }'
        doc.head.appendChild(print)
        const negated = doc.createElement('style')

        negated.media = 'not screen'
        negated.textContent = '.foo { opacity: 0; }'
        doc.head.appendChild(negated)

        return new Cypress.Promise<void>((resolve) => {
          const link = doc.createElement('link')

          link.rel = 'stylesheet'
          link.media = '(min-width: 601px)'
          link.href = '/fixtures/generic_styles.css'
          link.onload = () => resolve()
          doc.head.appendChild(link)
        })
      })

      cy.get('.foo').should('have.css', 'color', width === 500 ? 'rgb(255, 0, 0)' : 'rgb(0, 128, 0)')
      cy.document().then((doc) => {
        const capture = create(cy.$$, cy.state)
        const ids = capture.getStyleIds()
        const styles = capture.getStylesByIds(ids.headStyleIds)
        const link = doc.querySelector('link')!

        link.media = 'not screen'
        capture.getStyleIds() // a later capture must not change the saved media
        doc.head.querySelectorAll('style,link[rel="stylesheet"]').forEach((node) => node.remove())
        styles.forEach((style) => doc.head.appendChild(createSnapshotStyle(doc, style)))
      })

      cy.get('.foo').should('be.visible')
      .and('have.css', 'color', width === 500 ? 'rgb(255, 0, 0)' : 'rgb(0, 128, 0)')
      .and('have.css', 'border-left-width', '7px')
      .and('have.css', 'opacity', '1')
      .then((element) => {
        const doc = element[0].ownerDocument

        expect(doc.querySelector('style[media="print, screen"]')).not.to.eq(null)
        expect(doc.querySelector('style[media="print"]')).to.eq(null)
      })
    })
  }
})

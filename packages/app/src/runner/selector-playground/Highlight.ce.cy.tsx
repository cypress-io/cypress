import Highlight from './Highlight.ce.vue'

describe('<Highlight />', () => {
  it('playground', () => {
    cy.mount(() => {
      return (
        <Highlight
          selector='#asdf'
          style={{
            height: '22px',
            left: '214px',
            margin: '0px',
            padding: '0px',
            position: 'absolute',
            top: '646.390625px',
            transform: 'none',
            width: '204px',
            zIndex: 2147483647,
          }}
        />
      )
    })

    cy.percySnapshot()
  })

  it('shows tooltip at bottom when highlighted area is placed high', () => {
    cy.mount(() => {
      return (
        <Highlight
          selector='#asdf'
          style={{
            height: '22px',
            left: '214px',
            margin: '0px',
            padding: '0px',
            position: 'absolute',
            top: '0px',
            transform: 'none',
            width: '204px',
            zIndex: 2147483647,
          }}
        />
      )
    })

    cy.get('.tooltip').should('be.visible')

    cy.get('.tooltip').then(($el) => {
      // 0 is the top value of the highlight element
      expect(parseFloat($el.css('top'))).to.be.greaterThan(0)
    })

    cy.percySnapshot()
  })
})

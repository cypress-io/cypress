import React from 'react'

function StatefulComponent ({ foo }) {
  const [bar, setBar] = React.useState(0)

  return (
    <button
      onClick={() => {
        setBar(bar + 1)
      }}
    >
      {foo} {bar}
    </button>
  )
}

describe('re-render', () => {
  it('maintains component state across re-renders', () => {
    cy.mount(<StatefulComponent foo="baz" />).then(({ rerender }) => {
      cy.get('button').should('have.text', 'baz 0')
      cy.get('button').click().should('have.text', 'baz 1')
      rerender(<StatefulComponent foo="baz" />)

      // The button should still show 1 after re-render
      cy.get('button').should('have.text', 'baz 1')
    })
  })
})

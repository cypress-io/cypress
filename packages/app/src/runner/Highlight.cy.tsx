import Highlight from './Highlight.vue'

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
  })
})

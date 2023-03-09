import React from 'react'

describe('Errors', () => {
  const Errors = (props) => {
    if (props.throwError) throw new Error('mount error')

    return (
      <div>
        <button
          id="sync-error"
          onClick={() => {
            throw new Error('sync error')
          }}
        >
          Sync Error
        </button>
        <button
          id="async-error"
          onClick={() => {
            setTimeout(() => {
              throw new Error('async error')
            }, 50)
          }}
        >
          Async Error
        </button>
      </div>
    )
  }

  it('error on mount', () => {
    cy.mount(<Errors throwError />)
  })

  it('sync error', () => {
    cy.mount(<Errors />)
    cy.get('#sync-error').click()
  })

  it('async error', () => {
    cy.mount(<Errors />)
    cy.get('#async-error').click()
  })

  it('command failure', { defaultCommandTimeout: 50 }, () => {
    cy.mount(<Errors />)
    cy.get('element-that-does-not-exist')
  })
})

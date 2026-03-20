import React from 'react'
import { mount } from '@cypress/react'

const Button = ({
  children,
  ...rest
}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => {
  return <button {...rest}>{children}</button>
}

describe('Component spec in typescript', () => {
  it('works', () => {
    mount(<Button>Button Label</Button>)
    cy.contains('button', 'Button Label').should('be.visible')
  })
})

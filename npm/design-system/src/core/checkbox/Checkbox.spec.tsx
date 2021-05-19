import React, { useState } from 'react'
import { mount } from '@cypress/react'
import { Checkbox } from './Checkbox'

const contents = 'Is checked?'
const sharedProps = {
  checked: true,
  setChecked: () => { },
  label: {
    type: 'tag',
    contents
  }
}

describe('Checkbox', () => {
  it('renders', () => {
    mount(
      <Checkbox {...sharedProps} />
    )
      .get('input[type=checkbox]')
      .should('exist')
  })

  it('properly renders label types of aria', () => {
    mount(<Checkbox {...sharedProps}
      label={ {
        type: 'aria',
        contents
      }} />)
      .get('input')
      .should('have.attr', 'aria-label', contents)
      .get('body')
      .should('not.contain', contents)
  })

  it('properly renders labels when using tag', () => {
    const labelContents = 'Active'
    mount(<Checkbox { ...sharedProps }
      label={ {
        type: 'tag',
        contents: labelContents
      }} />)
      .get('label')
      .should('contain', labelContents)
      .get('input')
      .should('not.have.attr', 'aria-label')
  })

  it('input id the label\'s "for" when label is used', () => {
    mount(<Checkbox { ...sharedProps }/>)
    .get('label')
      .then(($label) => {
        const id = $label.attr('for')
        cy.get('input')
          .should('have.attr', 'id', id)
      })
  })
})

describe('Playground', () => {
  it('renders successfully', () => {
    const contents = "Is checked?"
    const CheckboxWrapper = () => {
      const [checked, setChecked] = useState(false)
      return <Checkbox { ...sharedProps } checked={ checked } setChecked={ setChecked } />
    }
    mount(<CheckboxWrapper />)
      .get('input')
      .should('not.have.focus')
      .should('not.be.checked')
      .click()
      .should('have.focus')
      .should('be.checked')
  })
})
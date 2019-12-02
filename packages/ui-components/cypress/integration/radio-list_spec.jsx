import React, { useState } from 'react'
import { render } from 'react-dom'
import { filter } from 'lodash/fp'
import { RadioInput, RadioGroup, CustomRadio } from '../../src'

const RadioStateExample = () => {
  const [checkedValue, setCheckedValue] = useState('v2')

  return (
    <>
      <RadioGroup value={checkedValue} onChange={(evt, value) => setCheckedValue(value)}>
        <RadioInput value="v1" />
        <RadioInput value="v2"/>
        <RadioInput value="v3"/>
      </RadioGroup>
      <span>{checkedValue}</span>
    </>
  )
}

const ExampleCustomRadioComponent = ({ checked }) => checked ? '◉' : '◎'
const ExampleCustomRadioComponent2 = ({ checked, label }) => (
  <div
    style={{
      background: checked ? 'rgb(0, 150, 254, 0.25)' : 'none',
      flex: 1,
      padding: '12px',
      textAlign: 'left',
    }}>
    {label}
  </div>
)

describe('<RadioGroup />', () => {
  beforeEach(() => {
    cy.visit('dist/index.html')
    cy.viewport(400, 600)
  })

  it('optionally provide a name', () => {
    cy.render(render, (
      <>
      <RadioGroup value="v2" name="myName">
        <RadioInput value="v1" data-test="v1" />
        <RadioInput value="v2" data-test="v2" />
        <RadioInput value="v3" data-test="v3" />
      </RadioGroup>
      <br/>
      <RadioGroup value="v1">
        <RadioInput value="v1" data-test="v1" />
        <RadioInput value="v2" data-test="v2" />
        <RadioInput value="v3" data-test="v3" />
      </RadioGroup>
      </>
    ))

    cy.get('input[name="myName"]').then((el) => expect(el.length).to.eql(3))
    cy.get('input').then((els) => {
      expect(els.length).to.eql(6)
      expect(filter((el) => el.name !== 'myName')(els).length).to.eql(3)
    })
  })

  it('can render multiple groups on the same page', () => {
    cy.render(render, (
      <>
      <RadioGroup value="v2" name="myName">
        <RadioInput value="v1" data-test="v1" />
        <RadioInput value="v2" data-test="v2" />
        <RadioInput value="v3" data-test="v3" />
      </RadioGroup>
      <br/>
      <RadioGroup value="v1">
        <RadioInput value="v1" data-test="v1" />
        <RadioInput value="v2" data-test="v2" />
        <RadioInput value="v3" data-test="v3" />
      </RadioGroup>
      <br/>
      <RadioGroup value="v3">
        <RadioInput value="v1" data-test="v1" />
        <RadioInput value="v2" data-test="v2" />
        <RadioInput value="v3" data-test="v3" />
      </RadioGroup>
      </>
    ))

    cy.get('input[name="myName"]').then((el) => expect(el.length).to.eql(3))
    cy.get('input').then((els) => {
      expect(els.length).to.eql(9)
      expect(filter((el) => el.name !== 'myName')(els).length).to.eql(6)
      expect(els[1].checked).to.be.true
      expect(els[3].checked).to.be.true
      expect(els[8].checked).to.be.true
    })
  })

  it('only a single radio is checked at a time', () => {
    cy.render(render, <RadioStateExample/>)

    cy.get('span').should('have.text', 'v2')
    cy.get('input[value="v1"]').click()

    cy.get('span').should('have.text', 'v1')
  })

  it('focus-able', () => {
    cy.render(render, (
      <RadioGroup value="v2">
        <RadioInput value="v1" data-test="v1" />
        <RadioInput value="v2" data-test="v2" />
        <RadioInput value="v3" data-test="v3" />
      </RadioGroup>
    ))

    cy.get('[data-test="v1"]').as('focused').first().focus()
    cy.window().then((win) => {
      cy.get('@focused').then((el) => {
        expect(win.document.activeElement).to.eql(el[0])
      })
    })
  })

  it('other components are permitted as children for a <RadioGroup />', () => {
    cy.render(render, (
      <div width="100%">
        <RadioGroup value="v2">
          <h3>Category 1</h3>
          <CustomRadio value="v1" data-test="v1" label="Item 1">
            {ExampleCustomRadioComponent2}
          </CustomRadio>
          <CustomRadio value="v2" data-test="v2" label="Item 2">
            {ExampleCustomRadioComponent2}
          </CustomRadio>
          <CustomRadio value="v3" data-test="v3" label="Item 3">
            {ExampleCustomRadioComponent2}
          </CustomRadio>
          <h3>Category 2</h3>
          <CustomRadio value="v4" data-test="v4" label="Item 4">
            {ExampleCustomRadioComponent2}
          </CustomRadio>
          <CustomRadio value="v5" data-test="v5" label="Item 5">
            {ExampleCustomRadioComponent2}
          </CustomRadio>
        </RadioGroup>
      </div>
    ))

    cy.get('h3').first().contains('Category 1')
    cy.get('h3').last().contains('Category 2')
  })

  describe('<CustomRadio />', () => {
    it('can render custom radio items instead of the default radio input style', () => {
      cy.render(render, (
        <RadioGroup value="v2">
          <CustomRadio value="v1" data-test="v1">
            {ExampleCustomRadioComponent}
          </CustomRadio>
          <CustomRadio value="v2" data-test="v2">
            {ExampleCustomRadioComponent}
          </CustomRadio>
          <CustomRadio value="v3" data-test="v3">
            {ExampleCustomRadioComponent}
          </CustomRadio>
        </RadioGroup>
      ))

      cy.get('[data-test="v1"]').should('have.text', '◎')
      cy.get('[data-test="v2"]').should('have.text', '◉')
      cy.get('[data-test="v3"]').should('have.text', '◎')
    })

    it('custom radio items are focus-able', () => {
      cy.render(render, (
        <RadioGroup value="v2">
          <CustomRadio value="v1" data-test="v1">
            {({ checked }) => <ExampleCustomRadioComponent checked={checked}/>}
          </CustomRadio>
          <CustomRadio value="v2" data-test="v2">
            {({ checked }) => <ExampleCustomRadioComponent checked={checked}/>}
          </CustomRadio>
          <CustomRadio value="v3" data-test="v3">
            {({ checked }) => <ExampleCustomRadioComponent checked={checked}/>}
          </CustomRadio>
        </RadioGroup>
      ))

      cy.get('[data-test="v1"]').as('focused').first().focus()
      cy.window().then((win) => {
        cy.get('@focused').then((el) => {
          expect(win.document.activeElement).to.eql(el[0])
        })
      })
    })

    it('custom radio items provide other props (aside from `onClick`) of CustomRadio to children', () => {
      cy.render(render, (
        <div width="100%">
          <RadioGroup value="v2">
            <CustomRadio value="v1" data-test="v1" label="Item 1">
              {ExampleCustomRadioComponent2}
            </CustomRadio>
            <CustomRadio value="v2" data-test="v2" label="Item 2">
              {ExampleCustomRadioComponent2}
            </CustomRadio>
            <CustomRadio value="v3" data-test="v3" label="Item 3">
              {ExampleCustomRadioComponent2}
            </CustomRadio>
          </RadioGroup>
        </div>
      ))

      cy.get('[data-test="v1"]').as('focused').first().focus()
      cy.window().then((win) => {
        cy.get('@focused').then((el) => {
          expect(win.document.activeElement).to.eql(el[0])
        })
      })
    })
  })
})

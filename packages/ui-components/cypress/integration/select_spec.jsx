import React, { useState } from 'react'
import { render } from 'react-dom'
import { Select, SelectItem } from '../../src'

const _ = Cypress._

describe('<Select />', () => {
  beforeEach(() => {
    cy.visit('dist/index.html')
    cy.viewport(400, 600)
  })

  it('optionally provide a name', () => {
    cy.render(render, (
      <>
        <Select value="v2" name="myName">
          <SelectItem value="v1" data-test="v1" />
          <SelectItem value="v2" data-test="v2" />
          <SelectItem value="v3" data-test="v3" />
        </Select>
        <br/>
        <Select value="v1">
          <SelectItem value="v1" data-test="v1" />
          <SelectItem value="v2" data-test="v2" />
          <SelectItem value="v3" data-test="v3" />
        </Select>
      </>
    ))

    cy.get('input[name="myName"]').then((el) => expect(el.length).to.eql(3))
    cy.get('input').then((els) => {
      expect(els.length).to.eql(6)
      expect(_.filter(els, (el) => el.name !== 'myName').length).to.eql(3)
    })
  })

  it('can render multiple groups on the same page', () => {
    cy.render(render, (
      <>
        <Select value="v2" name="myName">
          <SelectItem value="v1" data-test="v1" />
          <SelectItem value="v2" data-test="v2" />
          <SelectItem value="v3" data-test="v3" />
        </Select>
        <br/>
        <Select value="v1">
          <SelectItem value="v1" data-test="v1" />
          <SelectItem value="v2" data-test="v2" />
          <SelectItem value="v3" data-test="v3" />
        </Select>
        <br/>
        <Select value="v3">
          <SelectItem value="v1" data-test="v1" />
          <SelectItem value="v2" data-test="v2" />
          <SelectItem value="v3" data-test="v3" />
        </Select>
      </>
    ))

    cy.get('input[name="myName"]').then((el) => expect(el.length).to.eql(3))
    cy.get('input').then((els) => {
      expect(els.length).to.eql(9)
      expect(_.filter(els, (el) => el.name !== 'myName').length).to.eql(6)
      expect(els[1].checked).to.be.true
      expect(els[3].checked).to.be.true
      expect(els[8].checked).to.be.true
    })
  })

  it('only a single SelectItem is checked at a time', () => {
    const onChange = cy.stub()

    cy.render(render, (
      <Select value="v2" onChange={onChange}>
        <SelectItem value="v1" />
        <SelectItem value="v2" />
        <SelectItem value="v3" />
      </Select>
    ))

    cy.get('[data-value="v1"]').click()
    .then(() => expect(onChange).to.be.calledWith('v1'))

    cy.get('[data-value="v3"]').click()
    .then(() => expect(onChange).to.be.calledWith('v3'))
  })

  it('other components are permitted as children for a <Select />', () => {
    cy.render(render, (
      <div width="100%">
        <Select value="oranges">
          <h3>Fruits</h3>
          <label><SelectItem value="apples" data-test="apples" /> apples</label>
          <label><SelectItem value="oranges" data-test="oranges" /> oranges</label>
          <h3>Vegetables</h3>
          <label><SelectItem value="apples" data-test="apples" /> carrot</label>
          <label><SelectItem value="oranges" data-test="oranges" /> potato</label>
        </Select>
      </div>
    ))

    cy.get('h3').first().contains('Fruits')
    cy.get('h3').last().contains('Vegetables')
  })

  describe('single value selection', () => {
    it('focus-able', () => {
      cy.render(render, (
        <Select value="v2">
          <SelectItem value="v1" />
          <SelectItem value="v2" />
          <SelectItem value="v3" />
        </Select>
      ))

      cy.get('[value="v1"]').as('focused').first().focus()
      cy.window().then((win) => {
        cy.get('@focused').then((el) => {
          expect(win.document.activeElement).to.eql(el[0])
        })
      })
    })

    // requires native event tab support
    // cypress-plugin-tab does not mimic the behavior of tabbing in this context exactly as the browser does
    it.skip('tabbing moves focus to the next element with a tabIndex', () => {
      cy.render(render, (
        <Select>
          <SelectItem value="v1" data-test={`v1`} />
          <input type="text"/>
          <SelectItem value="v2" data-test={`v2`} />
          <SelectItem value="v3" data-test={`v3`} />
        </Select>
      ))

      cy.get('[data-test="v1"]').focus().tab()
      cy.window().then((win) => {
        cy.get('input[type="text"]').then((el) => {
          expect(win.document.activeElement).to.eql(el[0])
        })
      })

      cy.get('[data-test="v3"]').focus().tab({ shift: true })
      cy.window().then((win) => {
        cy.get('input[type="text"]').then((el) => {
          expect(win.document.activeElement).to.eql(el[0])
        })
      })
    })

    describe('arrow keys', () => {
      const left = 13
      const up = 38
      const right = 39
      const down = 40
      let onChange

      beforeEach(() => {
        const Wrapper = ({ onChangeSpy }) => {
          const [selected, setSelected] = useState()

          const onChange = (value) => {
            onChangeSpy(value)
            setSelected(value)
          }

          return (
            <Select value={selected} onChange={onChange}>
              <SelectItem value="v1" />
              <input type="text"/>
              <SelectItem value="v2" />
              <SelectItem value="v3" />
              <SelectItem value="v4">
                <input data-cy="input" type="text" />
              </SelectItem>
              <SelectItem value="v5" />
            </Select>
          )
        }

        onChange = cy.spy()

        cy.render(render, <Wrapper onChangeSpy={onChange} />)
        cy.get('li').as('items')
        cy.get('[value]').as('values')
      })

      it('left on first goes to last', () => {
        cy.get('@items').first().click().trigger('keydown', { keyCode: left, which: left })
        cy.get('@values').last().should('be.checked')
        cy.wrap(onChange).should('be.calledWith', 'v5')
      })

      it('up on first goes to last', () => {
        cy.get('@items').first().click().trigger('keydown', { keyCode: up, which: up })
        cy.get('@values').last().should('be.checked')
        cy.wrap(onChange).should('be.calledWith', 'v5')
      })

      it('right on last goes to first', () => {
        cy.get('@items').last().click().trigger('keydown', { keyCode: right, which: right })
        cy.get('@values').first().should('be.checked')
        cy.wrap(onChange).should('be.calledWith', 'v1')
      })

      it('down on last goes to first', () => {
        cy.get('@items').last().click().trigger('keydown', { keyCode: down, which: down })
        cy.get('@values').first().should('be.checked')
        cy.wrap(onChange).should('be.calledWith', 'v1')
      })

      it('left on last goes to penultimate', () => {
        cy.get('@items').last().click().trigger('keydown', { keyCode: left, which: left })
        cy.get('@values').eq(3).should('be.checked')
        cy.wrap(onChange).should('be.calledWith', 'v4')
      })

      it('up on last goes to penultimate', () => {
        cy.get('@items').last().click().trigger('keydown', { keyCode: up, which: up })
        cy.get('@values').eq(3).should('be.checked')
        cy.wrap(onChange).should('be.calledWith', 'v4')
      })

      it('right on first goes to second', () => {
        cy.get('@items').first().click().trigger('keydown', { keyCode: right, which: right })
        cy.get('@values').eq(1).should('be.checked')
        cy.wrap(onChange).should('be.calledWith', 'v2')
      })

      it('down on first goes to second', () => {
        cy.get('@items').first().click().trigger('keydown', { keyCode: down, which: down })
        cy.get('@values').eq(1).should('be.checked')
        cy.wrap(onChange).should('be.calledWith', 'v2')
      })

      describe('when keydown comes from inner element', () => {
        it('does not move on left', () => {
          cy.get('[data-cy="input"]').type('{leftarrow}')
          cy.get('@values').eq(3).should('be.checked')
        })

        it('does not move on right', () => {
          cy.get('[data-cy="input"]').type('{rightarrow}')
          cy.get('@values').eq(3).should('be.checked')
        })

        it('does not move on up', () => {
          cy.get('[data-cy="input"]').type('{uparrow}')
          cy.get('@values').eq(3).should('be.checked')
        })

        it('does not move on down', () => {
          cy.get('[data-cy="input"]').type('{downarrow}')
          cy.get('@values').eq(3).should('be.checked')
        })
      })
    })
  })
})

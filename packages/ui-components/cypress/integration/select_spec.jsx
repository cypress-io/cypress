import React from 'react'
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
    const handleChange = cy.stub()

    cy.render(render, (
      <Select value="v2" onChange={(evt, value) => {
        handleChange(value)
      }}>
        <SelectItem value="v1" />
        <SelectItem value="v2" />
        <SelectItem value="v3" />
      </Select>
    ))

    cy.get('[value="v1"]').click()
    .then(() => expect(handleChange).to.be.calledWith('v1'))

    cy.get('[value="v3"]').click()
    .then(() => expect(handleChange).to.be.calledWith('v3'))
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

    it('left/down and right/up arrow keys cycle the checked item', () => {
      cy.render(render, (
        <Select>
          <SelectItem value="v1" />
          <input type="text"/>
          <SelectItem value="v2" />
          <SelectItem value="v3" />
          <SelectItem value="v4" />
          <SelectItem value="v5" />
        </Select>
      ))

      const left = 13
      const up = 38
      const right = 39
      const down = 40

      cy.get('[value]').as('values')

      cy.get('@values').first().click().trigger('keydown', { keyCode: left, which: left })
      cy.get('@values').last().then((el) => {
        expect(el.is(':checked')).to.be.true
      })

      cy.get('@values').first().click().trigger('keydown', { keyCode: up, which: up })
      cy.get('@values').last().then((el) => {
        expect(el.is(':checked')).to.be.true
      })

      cy.get('@values').last().click().trigger('keydown', { keyCode: right, which: right })
      cy.get('@values').first().then((el) => {
        expect(el.is(':checked')).to.be.true
      })

      cy.get('@values').last().click().trigger('keydown', { keyCode: down, which: down })
      cy.get('@values').first().then((el) => {
        expect(el.is(':checked')).to.be.true
      })

      cy.get('@values').last().click().trigger('keydown', { keyCode: left, which: left })
      cy.get('@values').eq(3).then((el) => {
        expect(el.is(':checked')).to.be.true
      })

      cy.get('@values').last().click().trigger('keydown', { keyCode: up, which: up })
      cy.get('@values').eq(3).then((el) => {
        expect(el.is(':checked')).to.be.true
      })

      cy.get('@values').first().click().trigger('keydown', { keyCode: right, which: right })
      cy.get('@values').eq(1).then((el) => {
        expect(el.is(':checked')).to.be.true
      })

      cy.get('@values').first().click().trigger('keydown', { keyCode: down, which: down })
      cy.get('@values').eq(1).then((el) => {
        expect(el.is(':checked')).to.be.true
      })
    })
  })
})

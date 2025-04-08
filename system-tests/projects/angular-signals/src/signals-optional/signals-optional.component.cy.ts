import { signal } from '@angular/core'
import { SignalsOptionalComponent } from './signals-optional.component'
import { createOutputSpy } from 'cypress/angular'

it('can handle default props', () => {
  cy.mount(SignalsOptionalComponent)

  cy.get('[data-cy="signals-optional-component-title-display"]').should('contain.text', 'Default Title')
  cy.get('[data-cy="signals-optional-component-count-display"]').should('contain.text', '0')
})

it('can handle one prop', () => {
  cy.mount(SignalsOptionalComponent, {
    componentProperties: {
      title: 'propTitle',
    },
  })

  cy.get('[data-cy="signals-optional-component-title-display"]').should('contain.text', 'propTitle')
  cy.get('[data-cy="signals-optional-component-count-display"]').should('contain.text', '0')
  cy.get('[data-cy="signals-optional-component-set-signal"]').should('contain.text', '3')
})

it('can handle primitive props', () => {
  cy.mount(SignalsOptionalComponent, {
    componentProperties: {
      title: 'Prop Title',
      count: 7,
      // @ts-expect-error
      countChange: createOutputSpy('countChange'),
    },
  })

  cy.get('[data-cy="signals-optional-component-title-display"]').should('contain.text', 'Prop Title')
  cy.get('[data-cy="signals-optional-component-count-display"]').should('contain.text', '7')
  cy.get('[data-cy="signals-optional-component-count-incr"]').click()
  cy.get('@countChange').should('have.been.calledWith', 8)
})

it('also allows writable signal as input signal / model signal', () => {
  const titlePropAsSignal = signal('Prop Title as Signal')
  const countSignal = signal(3)

  cy.mount(SignalsOptionalComponent, {
    componentProperties: {
      title: titlePropAsSignal,
      count: countSignal,
      // @ts-expect-error
      countChange: createOutputSpy('countChange'),
      titleChange: createOutputSpy('titleChange'),
    },
  })

  cy.get('[data-cy="signals-optional-component-title-display"]').should('contain.text', 'Prop Title as Signal')
  cy.then(() => {
    // this should work as we have 1 way binding down to the component.
    // this is cypress specific to test input functionality
    titlePropAsSignal.set('Prop Title Updated as Signal')
  })

  cy.get('[data-cy="signals-optional-component-count-incr"]').click()
  cy.get('@countChange').should('have.been.calledWith', 4)

  // input props do not emit out of the component.
  cy.get('@titleChange').should('not.have.been.called')
  // instead, you can assert on the component itself or the passed in signal itself
  cy.get('[data-cy="signals-optional-component-title-display"]').should('contain.text', 'Prop Title Updated as Signal')
})

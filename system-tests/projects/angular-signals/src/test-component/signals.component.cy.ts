import { signal, computed } from '@angular/core'
import { SignalsComponent } from './signals.component'
import { createOutputSpy } from 'cypress/angular-signals'

it('can handle input signal as primitive value (title prop)', () => {
  cy.mount(SignalsComponent, {
    componentProperties: {
      title: 'Signals Component as Primitive',
      count: signal(0),
    },
  })

  cy.get('[data-cy="signal-component-title-display"]').should('contain.text', 'Signals Component as Primitive')
})

// FIXME: we currently need to allow this as there isn't a great way to set input signals in a component due to how input signals are instantiated
it('also allows writable signal as input signal', () => {
  cy.mount(SignalsComponent, {
    componentProperties: {
      title: signal('Signals Component Title as Signal'),
      count: signal(0),
    },
  })

  cy.get('[data-cy="signal-component-title-display"]').should('contain.text', 'Signals Component Title as Signal')
})

it('can handle model signal as primitive value', () => {
  cy.mount(SignalsComponent, {
    componentProperties: {
      title: 'Signals Component',
      count: -5,
    },
  })

  cy.get('[data-cy="signal-component-count-decr"]').click()
  cy.get('[data-cy="signal-component-count-display"]').should('contain.text', '-6')
})

it('can assert on the signal itself', () => {
  const countSignal = signal(0)

  cy.mount(SignalsComponent, {
    componentProperties: {
      title: 'Signals Component',
      count: countSignal,
    },
  })

  cy.get('[data-cy="signal-component-count-display"]').should('contain.text', '0').then(() => {
    expect(countSignal()).to.equal(0)
  })

  cy.get('[data-cy="signal-component-count-incr"]').click()

  cy.get('[data-cy="signal-component-count-display"]').should('contain.text', '1').then(() => {
    expect(countSignal()).to.equal(1)
  })
})

// @see https://angular.dev/guide/signals#computed-signals
it('allows use of computed signals', () => {
  const countSignal = signal(0)
  const doubleCountSignal = computed(() => countSignal() * 2)

  cy.mount(SignalsComponent, {
    componentProperties: {
      title: 'Signals Component',
      count: countSignal,
    },
  })

  cy.get('[data-cy="signal-component-count-incr"]').click()
  cy.get('[data-cy="signal-component-count-incr"]').click()
  cy.then(() => {
    expect(doubleCountSignal()).to.equal(4)
  })
})

// @see https://angular.dev/guide/signals/model#two-way-binding-with-signals
it('can support two way signal binding', () => {
  const countSignal = signal(0)

  cy.mount(SignalsComponent, {
    componentProperties: {
      title: 'Signals Component',
      count: countSignal,
    },
  })

  cy.get('[data-cy="signal-component-count-incr"]').click().then(() => {
    // we clicked the incrementor, so count signal should now be 1 due to 2 way binding
    const currentSignalVal = countSignal()

    expect(currentSignalVal).to.equal(1)

    // since we set the signal in the parent, due to 2 way binding, the value should now be 5 in the component
    countSignal.set(5)
  })

  cy.get('[data-cy="signal-component-count-incr"]').click().then(() => {
    const currentSignalVal = countSignal()

    // we clicked the incrementor, so count signal should now be 6 due to 2 way binding
    expect(currentSignalVal).to.equal(6)
  })
})

// @see https://angular.dev/guide/signals/model#two-way-binding-with-plain-properties.
// Since we cannot update primitives outside of the angular scope of signals, we need to support output spies for models propagating back up out of the component
it('can handle output spy for signal', () => {
  cy.mount(SignalsComponent, {
    componentProperties: {
      title: 'Signals Component',
      count: 5,
      // @ts-expect-error
      countChange: createOutputSpy('countChange'),
    },
  })

  cy.get('[data-cy="signal-component-count-incr"]').click()
  cy.get('@countChange').should('have.been.calledWith', 6)
})

it('can handle autoSpyOutputs for signals', () => {
  cy.mount(SignalsComponent, {
    componentProperties: {
      title: 'Signals Component',
      count: 5,
    },
    autoSpyOutputs: true,
  })

  cy.get('[data-cy="signal-component-count-incr"]').click()
  cy.get('@countChangeSpy').should('have.been.calledWith', 6)
})

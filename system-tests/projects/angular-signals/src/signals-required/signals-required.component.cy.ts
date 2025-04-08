import { signal, computed } from '@angular/core'
import { SignalsRequiredComponent } from './signals-required.component'
import { createOutputSpy } from 'cypress/angular'

// NOTE: if this is the only test in your test suite, this error will continually throw until the fixture is closed.
it('errors on required props missing', (done) => {
  cy.once('uncaught:exception', (e) => {
    expect(e.message).to.include('Input is required but no value is available yet.')
    done()

    return true
  })

  cy.mount(SignalsRequiredComponent)
})

it('can handle input signal as primitive value (title prop)', () => {
  cy.mount(SignalsRequiredComponent, {
    componentProperties: {
      title: 'Signals Component as Primitive',
      count: signal(0),
    },
  })

  cy.get('[data-cy="signals-required-component-title-display"]').should('contain.text', 'Signals Component as Primitive')
})

// FIXME: we currently need to allow this as there isn't a great way to set input signals in a component due to how input signals are instantiated.
// This also should lead to a better testing experience where the input signal can actually be asserted, though not possible within the constraints
// of the regular angular framework.
// @see https://github.com/cypress-io/cypress/issues/29732.
it('also allows writable signal as input signal', () => {
  cy.mount(SignalsRequiredComponent, {
    componentProperties: {
      title: signal('Signals Component Title as Signal'),
      count: signal(0),
    },
  })

  cy.get('[data-cy="signals-required-component-title-display"]').should('contain.text', 'Signals Component Title as Signal')
})

it('can handle model signal as primitive value', () => {
  cy.mount(SignalsRequiredComponent, {
    componentProperties: {
      title: 'Signals Required Component',
      count: -5,
    },
  })

  cy.get('[data-cy="signals-required-component-count-decr"]').click()
  cy.get('[data-cy="signals-required-component-count-display"]').should('contain.text', '-6')
})

it('can assert on the signal itself', () => {
  const countSignal = signal(0)

  cy.mount(SignalsRequiredComponent, {
    componentProperties: {
      title: 'Signals Required Component',
      count: countSignal,
    },
  })

  cy.get('[data-cy="signals-required-component-count-display"]').should('contain.text', '0').then(() => {
    expect(countSignal()).to.equal(0)
  })

  cy.get('[data-cy="signals-required-component-count-incr"]').click()

  cy.get('[data-cy="signals-required-component-count-display"]').should('contain.text', '1').then(() => {
    expect(countSignal()).to.equal(1)
  })
})

// @see https://angular.dev/guide/signals#computed-signals
it('allows use of computed signals', () => {
  const countSignal = signal(0)
  const doubleCountSignal = computed(() => countSignal() * 2)

  cy.mount(SignalsRequiredComponent, {
    componentProperties: {
      title: 'Signals Required Component',
      count: countSignal,
    },
  })

  cy.get('[data-cy="signals-required-component-count-incr"]').click()
  cy.get('[data-cy="signals-required-component-count-incr"]').click()
  cy.then(() => {
    expect(doubleCountSignal()).to.equal(4)
  })
})

// @see https://angular.dev/guide/signals/model#two-way-binding-with-signals
it('can support two way signal binding', () => {
  const countSignal = signal(0)

  cy.mount(SignalsRequiredComponent, {
    componentProperties: {
      title: 'Signals Required Component',
      count: countSignal,
    },
  })

  cy.get('[data-cy="signals-required-component-count-incr"]').click().then(() => {
    // we clicked the incrementor, so count signal should now be 1 due to 2 way binding
    const currentSignalVal = countSignal()

    expect(currentSignalVal).to.equal(1)

    // since we set the signal in the parent, due to 2 way binding, the value should now be 5 in the component
    countSignal.set(5)
  })

  cy.get('[data-cy="signals-required-component-count-incr"]').click().then(() => {
    const currentSignalVal = countSignal()

    // we clicked the incrementor, so count signal should now be 6 due to 2 way binding
    expect(currentSignalVal).to.equal(6)
  })
})

// @see https://angular.dev/guide/signals/model#two-way-binding-with-plain-properties.
// Since we cannot update primitives outside of the angular scope of signals, we need to support output spies for models propagating back up out of the component
it('can handle output spy for signal', () => {
  cy.mount(SignalsRequiredComponent, {
    componentProperties: {
      title: 'Signals Required Component',
      count: 5,
      // @ts-expect-error
      countChange: createOutputSpy('countChange'),
    },
  })

  cy.get('[data-cy="signals-required-component-count-incr"]').click()
  cy.get('@countChange').should('have.been.calledWith', 6)
})

it('can handle autoSpyOutputs for signals', () => {
  cy.mount(SignalsRequiredComponent, {
    componentProperties: {
      title: 'Signals Required Component',
      count: 5,
    },
    autoSpyOutputs: true,
  })

  cy.get('[data-cy="signals-required-component-count-incr"]').click()
  cy.get('@countChangeSpy').should('have.been.calledWith', 6)
})

import { signal } from '@angular/core'
import { SignalsComplexComponent } from './signals-complex.component'
import { createOutputSpy } from 'cypress/angular'
import cloneDeep from 'lodash/cloneDeep'

const user = {
  firstName: 'Hank',
  lastName: 'Hill',
  age: 41,
}

const acquaintances = [
  {
    firstName: 'Jeffrey',
    lastName: 'Boomhauer III',
    age: 42,
  },
  {
    firstName: 'Dale',
    lastName: 'Gribble',
    age: 42,
  },
  {
    firstName: 'Bill',
    lastName: 'Dauterive',
    age: 41,
  },
]

it('can pass in complex props', () => {
  cy.mount(SignalsComplexComponent, {
    componentProperties: {
      user: cloneDeep(user),
      acquaintances: cloneDeep(acquaintances),
    },
  })
})

it('can pass in complex props as signals and mutate them', () => {
  const userRef = cloneDeep(user)
  const acquaintancesRef = cloneDeep(acquaintances)
  const userSignal = signal(userRef)
  const acquaintancesSignal = signal(acquaintancesRef)

  cy.mount(SignalsComplexComponent, {
    componentProperties: {
      user: userSignal,
      acquaintances: acquaintancesSignal,
      // @ts-ignore
      acquaintancesChange: createOutputSpy('acquaintancesChange'),
    },
  })

  cy.get('[data-cy="signals-complex-user-display"] [data-cy="firstName"]').should('contain.text', 'Hank')
  cy.get('ul[data-cy="signals-complex-acquaintances-list"] li').should('have.length', 3)
  cy.then(() => {
    // Update the signal references
    // and verify they are displayed in the component
    userSignal.set({
      ...userRef,
      firstName: 'Foo',
    })

    const acquaintancesRefNew = cloneDeep(acquaintances)

    acquaintancesRefNew.push({
      firstName: 'Bobby',
      lastName: ' Hill',
      age: 12,
    })

    acquaintancesSignal.set(acquaintancesRefNew)
  })

  cy.get('[data-cy="signals-complex-user-display"] [data-cy="firstName"]').should('contain.text', 'Foo')
  cy.get('ul[data-cy="signals-complex-acquaintances-list"] li').should('have.length', 4)
  cy.get('@acquaintancesChange').should('have.been.called')
})

import { ControlFlowComponent, SuperHero } from './control-flow.component'

// @see https://angular.dev/guide/templates/control-flow
it('works with basic control flow', () => {
  const superHeroes: SuperHero[] = [
    {
      name: 'Clark Kent',
      nickname: 'Man of Steel',
      age: 28,
      isMortal: true,
    },
    {
      name: 'Wade T. Wilson',
      nickname: 'Deadpool',
      age: 43,
      isMortal: false,
    },
  ]

  cy.mount(ControlFlowComponent, {
    componentProperties: {
      superHeroes,
    },
  })

  cy.get('[data-index="0"]').as('superman')
  cy.get('[data-index="1"]').as('deadpool')

  cy.get('@superman').find('[data-cy="name"]').should('contain.text', 'Clark Kent')
  cy.get('@superman').find('[data-cy="nickname"]').should('contain.text', 'Man of Steel')
  cy.get('@superman').find('[data-cy="age"]').should('contain.text', '28 is younger than 30')
  cy.get('@superman').find('[data-cy="mortality"]').should('contain.text', 'I am mortal. I will eventually die')

  cy.get('@deadpool').find('[data-cy="name"]').should('contain.text', 'Wade T. Wilson')
  cy.get('@deadpool').find('[data-cy="nickname"]').should('contain.text', 'Deadpool')
  cy.get('@deadpool').find('[data-cy="age"]').should('contain.text', '43 is older than 30')
  cy.get('@deadpool').find('[data-cy="mortality"]').should('contain.text', 'I am immortal and will live forever')
})

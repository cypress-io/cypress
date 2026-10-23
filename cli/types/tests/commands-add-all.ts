declare namespace Cypress {
  interface Chainable {
    typedBulkParent(value: number): Chainable<number>
    typedBulkOther(value: string): Chainable<string>
    typedBulkChild(value: number): Chainable<JQuery>
    typedBulkMulti(value: string): Chainable<unknown>
  }
}

Cypress.Commands.addAll({
  typedBulkParent (value) {
    value // $ExpectType number
    this // $ExpectType Context

    return cy.wrap(value)
  },
  typedBulkOther (value) {
    value // $ExpectType string

    return cy.wrap(value)
  },
})

Cypress.Commands.addAll({ prevSubject: false }, {
  typedBulkParent (value) {
    value // $ExpectType number
  },
})

Cypress.Commands.addAll({ prevSubject: 'element' }, {
  typedBulkChild (subject, value) {
    subject // $ExpectType JQueryWithSelector<HTMLElement>
    value // $ExpectType number

    return cy.wrap(subject)
  },
})

Cypress.Commands.addAll<'typedBulkChild', JQuery>({ prevSubject: true }, {
  typedBulkChild (subject, value) {
    subject // $ExpectType JQuery<HTMLElement>
    value // $ExpectType number
  },
})

Cypress.Commands.addAll({ prevSubject: ['element', 'document'] }, {
  typedBulkMulti (subject, value) {
    subject // $ExpectType Document | JQueryWithSelector<HTMLElement>
    value // $ExpectType string
  },
})

Cypress.Commands.addAll({
  // $ExpectError
  typedBulkParent: (value: string) => cy.wrap(123),
})

Cypress.Commands.addAll({
  // $ExpectError
  typedBulkParent: (value: number) => cy.wrap('wrong return type'),
})

Cypress.Commands.addAll({
  // $ExpectError
  undeclaredBulkCommand: () => {},
})

// $ExpectError
Cypress.Commands.addAll({ prevSubject: 'element' }, { typedBulkChild: (subject: Window, value: number) => {} })

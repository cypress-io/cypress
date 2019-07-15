//
// Test that plugin authors can write .d.ts files to extend Cypress types
// with new "cy" properties and new methods.
//
// Unfortunately we cannot test that vendor types located in node_modules are working
// since those are copied as part of the deploy process
//

/**
 * If you want to add additional properties to the "cy" object,
 * or additional methods to "cy" or "cy.<command>()" chained value,
 * declare them and TypeScript will merge new definitions with existing ones.
 * @see https://on.cypress.io/typescript#Types-for-custom-commands
*/
declare namespace Cypress {
  interface cy {
    /**
     * We have added a label property to "cy" object.
     * @example console.log(cy.myLabel)
    */
    myLabel: string,
    /**
     * Definition for a custom command "login" that was added separately
     * using `Cypress.Commands.add('login', (username, password) => {...})`.
     */
    login(username: string, password: string): Chainable
  }
  interface Chainable {
    /**
     * Additional property added to the chained object,
     * returned by Cypress commands. This property will NOT
     * be part of "cy" object, but a property of an object
     * returned by Cypress commands.
    ```
    cy.get('.element').chainerProp
    ```
    */
    chainerProp: number
  }
}

// $ExpectType string
cy.myLabel

// new custom command "cy.login"
// $ExpectType Chainable<any>
cy.login(Cypress.env('username'), Cypress.env('password'))

// "myLabel" property has been added to "interface cy"
// thus it is NOT of the command chain.
// $ExpectError
cy.get('.element').myLabel

// $ExpectType number
cy.chainerProp

// $ExpectType number
cy.get('.element').chainerProp

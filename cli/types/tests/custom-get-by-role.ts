// A project that already declared its own `getByRole` command keeps compiling:
// its signature merges with the built-in one as an extra overload.
declare global {
  namespace Cypress {
    interface Chainable {
      getByRole(role: string, customTimeoutMs: number): Chainable<string>
    }
  }
}

cy.getByRole('button', 1000) // $ExpectType Chainable<string>
cy.getByRole('button') // $ExpectType Chainable<JQuery<HTMLElement>>

export {}

declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject = any> {
    /**
     * Take a text snapshot of the current object
     */
    snapshot(): void;
  }
}

// The type declarations for Cypress Log Group & the corresponding configuration permutations
declare namespace Cypress {
  declare namespace Commands {
    declare namespace Sessions {
      type SessionSetup = (log: Cypress.Log) => Chainable<S>
      type SessionValidation = (log: Cypress.Log) => Chainable<S>
      
      interface LocalStorage {
        origin: string
        value: Record<string, any>
      }

      interface SessionData {
        id: string | Array<string>
        cookies: Array<Cypress.Cookie>
        localStorage: Array<LocalStorage>
        setup: () => void
        hydrated: boolean
        validate?: Cypress.SessionOptions['validate']
      }
    }
  }
}

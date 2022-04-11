// The type declarations for Cypress Log Group & the corresponding configuration permutations
declare namespace Cypress {
  declare namespace Commands {
    declare namespace Session {
      type ActiveSessions = Record<string, SessionData>
      type SessionSetup = (log: Cypress.Log) => Chainable<S>
      type SessionValidation = (log: Cypress.Log) => Chainable<S>
      
      interface LocalStorage {
        origin: string
        value: Record<string, any>
      }

      interface SessionData {
        id: string
        cookies?: Array<Cypress.Cookie> | null
        localStorage?: Array<LocalStorage> | null
        setup: () => void
        hydrated: boolean
        validate?: Cypress.SessionOptions['validate']
      }
    }
  }
}

// TODO: move types to more appropriate place
export {}

declare global {
  namespace Cypress {
    interface Chainable {
      puppeteer(name: string, ...args: any[]): Chainable
    }
  }
}

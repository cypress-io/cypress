import { HOST_MODULES_GLOBAL, HOST_MODULE_SPECIFIERS } from '@packages/types/src/host-modules'

// injectBundle settles a module-level deferred, so each test imports its own
// copy of the module: Vite treats every distinct query string as a new module.
const loadInjectBundle = (id: string): Promise<typeof import('./injectBundle')> => {
  return import(/* @vite-ignore */ `./injectBundle.ts?test=${id}`)
}

const rejectionMessage = (promise: Promise<void>) => {
  return promise.then(() => 'resolved', (err: Error) => err.message)
}

describe('runner/injectBundle', () => {
  beforeEach(() => {
    Reflect.deleteProperty(window, 'UnifiedRunner')
    Reflect.deleteProperty(window, HOST_MODULES_GLOBAL)
  })

  it('publishes every host module before the runner bundle runs, then resolves', () => {
    cy.intercept('GET', '/ns-ok/runner/cypress_runner.js', {
      headers: { 'content-type': 'text/javascript' },
      body: `window.hostModulesSeenByRunner = Object.keys(window.${HOST_MODULES_GLOBAL} || {}); window.UnifiedRunner = {}`,
    })

    cy.then(() => loadInjectBundle('ok')).then(({ injectBundle, dfd }) => {
      injectBundle('ns-ok')

      return cy.wrap(dfd.promise, { timeout: 10000 })
    }).then(() => {
      expect(Reflect.get(window, 'hostModulesSeenByRunner')).to.deep.eq([...HOST_MODULE_SPECIFIERS])
    })
  })

  it('rejects when the runner bundle fails to load', () => {
    cy.intercept('GET', '/ns-404/runner/cypress_runner.js', { statusCode: 404, body: '' })

    cy.then(() => loadInjectBundle('404')).then(({ injectBundle, dfd }) => {
      injectBundle('ns-404')

      return cy.wrap(rejectionMessage(dfd.promise), { timeout: 10000 })
    }).should('eq', 'Failed to load /ns-404/runner/cypress_runner.js')
  })

  it('rejects when the runner bundle throws before defining UnifiedRunner', () => {
    cy.on('uncaught:exception', (err) => !err.message.includes('runner bundle failed'))
    cy.intercept('GET', '/ns-throws/runner/cypress_runner.js', {
      headers: { 'content-type': 'text/javascript' },
      body: `throw new Error('runner bundle failed')`,
    })

    cy.then(() => loadInjectBundle('throws')).then(({ injectBundle, dfd }) => {
      injectBundle('ns-throws')

      return cy.wrap(rejectionMessage(dfd.promise), { timeout: 10000 })
    }).should('eq', '/ns-throws/runner/cypress_runner.js loaded but did not define window.UnifiedRunner')
  })
})

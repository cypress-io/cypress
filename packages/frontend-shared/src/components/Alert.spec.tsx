import Alert from './Alert.vue'

const alertTypes = ['default', 'error', 'warning', 'success', 'info'] as const
const exampleStackTrace = `some err message\n  at fn (foo.js:1:1)
  at Context.<anonymous> (BaseError.spec.tsx:57)
  at Context.runnable.fn (cypress:///../driver/src/cypress/cy.ts:1064)
  at callFn (cypress:///../driver/node_modules/mocha/lib/runnable.js:395)
  at Test.Runnable.run (cypress:///../driver/node_modules/mocha/lib/runnable.js:382)
  at eval (cypress:///../driver/src/cypress/runner.ts:1463)
  at PassThroughHandlerContext.finallyHandler (cypress:////Users/bart/Documents/github/cypress/node_modules/bluebird/js/release/finally.js:56)
  at PassThroughHandlerContext.tryCatcher (cypress:////Users/bart/Documents/github/cypress/node_modules/bluebird/js/release/util.js:16)
  at Promise._settlePromiseFromHandler (cypress:////Users/bart/Documents/github/cypress/node_modules/bluebird/js/release/promise.js:512)
  at Promise._settlePromise (cypress:////Users/bart/Documents/github/cypress/node_modules/bluebird/js/release/promise.js:569)
`

describe('<Alert />', { viewportHeight: 1500 }, () => {
  it('shows title only', () => {
    cy.mount(() => (
      <div class="flex flex-col p-4 gap-16px">
        <Alert type="success">Success</Alert>
        <Alert type="warning">Warning</Alert>
        <Alert type="error">Lorem ipsum dolor sit amet,
        consectetur adipiscing elit, sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua. Ut enim ad
        minim veniam, quis nostrud exercitation ullamco laboris nisi
        ut aliquip ex ea commodo consequat. Duis aute irure dolor
        in reprehenderit in voluptate velit esse cillum dolore eu
        fugiat nulla pariatur. Excepteur sint occaecat cupidatat
        non proident, sunt in culpa qui officia deserunt mollit
        anim id est laborum.</Alert>
        <Alert type="info"> Info</Alert>
        <Alert type="default">Default</Alert>

      </div>
    ))
  })

  it('shows title with details', () => {
    cy.mount(() => (
      <div class="flex flex-col p-4 gap-16px">
        {alertTypes.map((type) => (<Alert type={type} v-slots={{
          default: type,
          details: () => (<div>
            Lorem ipsum dolor sit amet,
            consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad
            minim veniam, quis nostrud exercitation ullamco laboris nisi
            ut aliquip ex ea commodo consequat. Duis aute irure dolor
            in reprehenderit in voluptate velit esse cillum dolore eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat
            non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </div>),
        }} />))}
      </div>
    ))
  })

  it('shows errors with title, details & stack', () => {
    cy.mount(() => (
      <div class="flex flex-col p-4 gap-16px">
        <Alert type="error" title="Error Title" v-slots={{
          details: () => (<div>
            Lorem ipsum dolor sit amet,
            consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad
            minim veniam, quis nostrud exercitation ullamco laboris nisi
            ut aliquip ex ea commodo consequat. Duis aute irure dolor
            in reprehenderit in voluptate velit esse cillum dolore eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat
            non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </div>),
        }} stackTrace={exampleStackTrace}/>
        <Alert type="error" title="No details" stackTrace={exampleStackTrace}/>
      </div>
    ))

    cy.contains('button', 'Stack Trace').click()
  })
})

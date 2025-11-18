describe('component testing stack utils', () => {
  beforeEach(() => {
    const root = document.querySelector('[data-cy-root]')

    if (root) {
      root.innerHTML = 'component test'
    }
  })

  // Test case for when users re-define Mocha's it function
  // This creates additional stack frames that need to be trimmed
  function myIt (name, fn) {
    if (fn) {
      it(name, fn)
    } else {
      it(name)
    }
  }

  myIt('does not trim component testing stack traces', () => {
    const details = Cypress.state('test').invocationDetails
    const isChromium = Cypress.isBrowser({ family: 'chromium' })
    const isFirefox = Cypress.isBrowser({ family: 'firefox' })

    expect(details.absoluteFile).to.contain('cypress/packages/driver/cypress/component/stack_utils-invocationDetails.cy.ts')
    expect(details.fileUrl).to.contain('http://localhost:8080/__cypress/src/spec-0.js')
    expect(details.function).to.contain('myIt')
    expect(details.line).to.equal(14)
    expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/component/stack_utils-invocationDetails.cy.ts')
    expect(details.relativeFile).to.contain('cypress/component/stack_utils-invocationDetails.cy.ts')

    if (isChromium) {
      expect(details.stack).to.equal(`Error
    at myIt (http://localhost:8080/__cypress/src/spec-0.js:22:7)
    at Suite.<anonymous> (http://localhost:8080/__cypress/src/spec-0.js:28:3)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)
    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27)
    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:128:31)`)
    } else if (isFirefox) {
      // the firefox traces are really long, so just validate the first line
      const firstLine = details.stack.split('\n')[0]

      expect(firstLine).to.equal('myIt@http://localhost:8080/__cypress/src/spec-0.js:22:9')
    }
  })

  it('does not trim component testing stack traces', () => {
    const details = Cypress.state('test').invocationDetails
    const isChromium = Cypress.isBrowser({ family: 'chromium' })
    const isFirefox = Cypress.isBrowser({ family: 'firefox' })

    expect(details.absoluteFile).to.contain('cypress/packages/driver/cypress/component/stack_utils-invocationDetails.cy.ts')
    expect(details.fileUrl).to.contain('http://localhost:8080/__cypress/src/spec-0.js')
    expect(details.line).to.equal(47)
    expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/component/stack_utils-invocationDetails.cy.ts')
    expect(details.relativeFile).to.contain('cypress/component/stack_utils-invocationDetails.cy.ts')

    if (isChromium) {
      expect(details.function).to.contain('Suite.<anonymous>')

      expect(details.stack).to.equal(`Error
    at Suite.<anonymous> (http://localhost:8080/__cypress/src/spec-0.js:55:3)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)
    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27)
    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:128:31)
    at eval (cypress:///../driver/src/cypress/mocha.ts:189:14)`)
    } else if (isFirefox) {
      // the firefox traces are really long, so just validate the first line
      const firstLine = details.stack.split('\n')[0]

      expect(firstLine).to.equal('./cypress/component/stack_utils-invocationDetails.cy.ts/<@http://localhost:8080/__cypress/src/spec-0.js:55:5')
    }
  })
})

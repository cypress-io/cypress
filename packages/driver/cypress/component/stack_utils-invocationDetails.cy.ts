describe('component testing stack utils', () => {
  beforeEach(() => {
    const root = document.querySelector('[data-cy-root]')

    if (root) {
      root.innerHTML = 'component test'
    }
  })

  it('does not trim component testing stack traces', () => {
    const details = Cypress.state('test').invocationDetails

    expect(details.absoluteFile).to.contain('cypress/packages/driver/cypress/component/stack_utils-invocationDetails.cy.ts')
    expect(details.fileUrl).to.contain('http://localhost:8080/__cypress/src/spec-0.js')
    expect(details.function).to.contain('Suite.<anonymous>')
    expect(details.line).to.equal(10)
    expect(details.originalFile).to.equal('webpack://@packages/driver/./cypress/component/stack_utils-invocationDetails.cy.ts')
    expect(details.relativeFile).to.contain('cypress/component/stack_utils-invocationDetails.cy.ts')
    expect(details.stack).to.equal(`Error
    at Suite.<anonymous> (http://localhost:8080/__cypress/src/spec-0.js:18:3)
    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19)
    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27)
    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:128:31)
    at eval (cypress:///../driver/src/cypress/mocha.ts:189:14)`)
  })
})

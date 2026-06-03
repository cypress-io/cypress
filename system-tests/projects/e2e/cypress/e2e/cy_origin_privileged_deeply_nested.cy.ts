describe('cy.origin privileged commands', () => {
  beforeEach(() => {
    cy.visit('/primary_origin.html')
    cy.get('a[data-cy="cross_origin_secondary_link"]').click()
  })

  // Regression test for https://github.com/cypress-io/cypress/issues/27784
  //
  // Privileged commands (cy.task here) are verified as spec-originated by
  // inspecting the captured Error stack for the `invokeOriginFn` frame. That
  // frame sits below the user code, so enough synchronous frames between the
  // command call and `invokeOriginFn` push it past the browser's default
  // stack-trace limit, and the command was incorrectly rejected with
  // "cy.task() must only be invoked from the spec file or support file".
  //
  // This is especially important in Firefox, which does not support
  // Error.captureStackTrace and so truncates at a shallower depth than Chrome.
  it('runs a deeply nested cy.task() inside a cy.origin() callback', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const deeplyNestedTask = (depth) => {
        if (depth === 0) {
          return cy.task('return:arg', 'deeply nested')
        }

        return deeplyNestedTask(depth - 1)
      }

      // 20 frames comfortably exceeds the default stack-trace limit of 10
      deeplyNestedTask(20).should('eq', 'deeply nested')
    })
  })
})

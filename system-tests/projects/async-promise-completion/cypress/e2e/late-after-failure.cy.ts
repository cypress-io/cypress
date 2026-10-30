let nativeFinished = false
let lateCommandRan = false

it('fails its queue before the native function finishes', { defaultCommandTimeout: 1000 }, async () => {
  cy.then(() => {
    expect(false, 'ASYNC_EARLY_FAILURE_BEFORE_NATIVE_END').to.equal(true)
  })

  await new Promise<void>((resolve) => setTimeout(resolve, 100))
  cy.then(() => {
    lateCommandRan = true
  })

  nativeFinished = true
})

it('does not run commands from the previous failed runnable', { defaultCommandTimeout: 1000 }, async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 200))
  expect(nativeFinished, 'the original native continuation actually finished').to.equal(true)
  expect(lateCommandRan, 'ASYNC_COMMAND_LEAKED_INTO_NEXT_TEST').to.equal(false)
})

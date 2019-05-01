describe('https passthru retries', function () {
  it('retries when visiting a non-test domain', function (done) {
    cy.window()
    .then(($win) => {
      $win.location.href = 'https://localhost:13371'
    })
    // `done` is never called
  })
})

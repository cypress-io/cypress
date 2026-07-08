// this ensures that special characters in the spec title are displayed
// properly. it tests the actual reporter instead of the AUT like other tests
describe('special characters', () => {
  it('displays file name with decoded special characters', () => {
    // the runner renders the command log inside a same-origin iframe; fall
    // back to the top document if the reporter rendered inline
    const topDoc = window.top!.document
    const reporterDoc = topDoc.querySelector<HTMLIFrameElement>('#reporter-frame')?.contentDocument ?? topDoc

    cy.wrap(Cypress.$(reporterDoc.body))
    .find('.reporter .runnable-header')
    .contains('meta_&%.cy.ts')
  })
})

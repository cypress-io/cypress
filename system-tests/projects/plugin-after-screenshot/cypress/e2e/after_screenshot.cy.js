const screenshotDetails = (name) => {
  let details

  return cy.screenshot(name, {
    capture: 'runner',
    onAfterScreenshot ($el, afterScreenshotDetails) {
      details = afterScreenshotDetails
    },
  })
  .then(() => details)
}

it('cy.screenshot() - replacement', () => {
  screenshotDetails('replace-me').then((details) => {
    expect(details.path).to.include('screenshot-replacement.png')
    expect(details.size).to.equal(2222)

    expect(details.dimensions).to.eql({ width: 2, height: 2 })
  })
})

it('cy.screenshot() - ignored values', () => {
  screenshotDetails('ignored-values').then((details) => {
    expect(details.path).to.include('ignored-values.png')
    expect(details.multipart).to.be.false

    expect(details.name).to.equal('ignored-values')
  })
})

it('cy.screenshot() - invalid return', () => {
  screenshotDetails('invalid-return').then((details) => {
    expect(details.path).to.include('invalid-return.png')
  })
})

it('failure screenshot - rename', () => {
  throw new Error('test error')
})

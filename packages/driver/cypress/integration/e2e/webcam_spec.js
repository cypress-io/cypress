describe('webcam support', () => {
  it('navigator.mediaDevices.getUserMedia resolves with fake media stream', () => {
    cy.visit('/fixtures/webcam.html')
    cy.window().then((win) => {
      return win.navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        const el = win.document.querySelector('video')

        el.srcObject = stream
        expect(stream.getVideoTracks()[0]).to.have.property('label', 'fake_device_0')
      })
    })
  })
})

before(function () {
  if (Cypress.browser.family === 'chrome') {
    return Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setDeviceMetricsOverride',
      params: {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        mobile: false,
        screenWidth: 1280,
        screenHeight: 720,
      },
    })
    .then(() => {
      expect(window.devicePixelRatio).to.eq(1)
    })
  }
})

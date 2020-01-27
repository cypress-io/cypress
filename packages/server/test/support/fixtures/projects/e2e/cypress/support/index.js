before(function () {
  if (Cypress.browser.family === 'chromium') {
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
      // can't tell expect() not to log, so manually throwing here
      if (window.devicePixelRatio !== 1) {
        throw new Error('Setting devicePixelRatio to 1 failed')
      }
    })
  }
})

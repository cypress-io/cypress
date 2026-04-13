const once = (fn) => {
  let called = false

  return function (...args) {
    if (called) return

    called = true

    return fn.apply(this, args)
  }
}

// we don't use a `before` here since that would show up in run results and cause confusion during test debugging
const before = once(function () {
  if (Cypress.isBrowser([{ name: '!electron', family: 'chromium' }])) {
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

Cypress.on('test:before:run:async', before)

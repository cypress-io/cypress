describe('proxying', () => {
  // load a script that has obstructive code and would otherwise be modified by the proxy
  // https://github.com/cypress-io/cypress/issues/8983
  it('does not fail integrity check for cross-origin scripts', () => {
    cy.visit('/index.html')
    .then((win) => {
      /**
       * @type {Document}
       */
      const document = win.document
      const script = document.createElement('script')

      script.src = 'https://localhost:7878/static/simple_obstructive_code.js'
      // to regenerate: `openssl dgst -sha256 -binary **/static/simple_obstructive_code.js | openssl base64 -A`
      script.integrity = 'sha256-BLwfivLJLqn8sjt9PEEXBlw6lO+DSZzFZ0rP/SWai2o='
      script.crossOrigin = 'anonymous'
      document.head.append(script)

      return new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = () => reject(new Error('script failed to load, check the console. Possibly a failed integrity check'))
      })
    })
  })
})

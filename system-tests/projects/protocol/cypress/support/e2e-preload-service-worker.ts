const setupServiceWorker = async () => {
  try {
    await window.navigator.serviceWorker?.register(new URL('http://localhost:2121/cypress/fixtures/service-worker-assets/scope/service-worker.js'))
  } catch (e) {
    // This errors the first time through before top is reloaded
  }
}

Cypress.on('test:before:run:async', setupServiceWorker)

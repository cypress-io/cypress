const swReq = (win) => {
  return new Promise((resolve) => {
    win.addEventListener('service-worker:ready', (event) => {
      expect(event.detail).to.deep.equal({
        example: {
          foo: 'bar',
        },
        cached: 'this response will be used by service worker',
      })

      resolve(win)
    })
  })
}

// Timeout of 1500 will ensure that the proxy correlation timeout is not hit
it('loads service worker', { defaultCommandTimeout: 1500 }, () => {
  cy.visit('https://localhost:1515/service-worker-assets/scope/service_worker.html')
  .then(swReq)
})

// Load the service worker again to ensure that the service worker cache
// can be loaded properly. There are requests that are made with the
// cache that have different headers that need to be tested in the proxy.
// Timeout of 1500 will ensure that the proxy correlation timeout is not hit
it('loads service worker', { defaultCommandTimeout: 1500 }, () => {
  cy.visit('https://localhost:1515/service-worker-assets/scope/service_worker.html')
  .then(swReq)
})

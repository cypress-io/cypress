const webWorker = (win) => {
  return new Promise((resolve) => {
    win.worker.onmessage = (e) => {
      if (e.data.foo === 'bar') {
        resolve(win)
      }
    }
  })
}

const sharedWorker = (win) => {
  return new Promise((resolve) => {
    win.sharedWorker.port.onmessage = (e) => {
      if (e.data.foo === 'baz') {
        resolve(win)
      }
    }
  })
}

// Timeout of 1500 will ensure that the proxy correlation timeout is not hit
it('loads web workers', { defaultCommandTimeout: 1500 }, () => {
  cy.visit('https://localhost:1515/web_worker.html')
  .then(webWorker)
  .then(sharedWorker)
})

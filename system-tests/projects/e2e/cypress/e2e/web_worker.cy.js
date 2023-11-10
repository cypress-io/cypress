const webWorker = (win) => {
  return new Promise((resolve) => {
    win.worker.onmessage = (e) => {
      if (e.data.foo === 'bar2') {
        resolve(win)
      }
    }

    win.worker.postMessage({
      foo: 'bar',
    })
  })
}

const sharedWorker = (win) => {
  return new Promise((resolve) => {
    win.sharedWorker.port.onmessage = (e) => {
      if (e.data.foo === 'baz2') {
        resolve(win)
      }
    }

    win.sharedWorker.port.postMessage({
      foo: 'baz',
    })
  })
}

// Timeout of 1900 will ensure that the proxy correlation timeout is not hit
it('loads web workers', { defaultCommandTimeout: 1900 }, () => {
  cy.visit('https://localhost:1515/web_worker.html')
  .then(webWorker)
  .then(sharedWorker)
})

// Timeout of 1900 will ensure that the proxy correlation timeout is not hit
it('reloads web workers', { defaultCommandTimeout: 1900 }, () => {
  cy.visit('https://localhost:1515/web_worker.html')

  cy.reload()
  .then(webWorker)
  .then(sharedWorker)
})

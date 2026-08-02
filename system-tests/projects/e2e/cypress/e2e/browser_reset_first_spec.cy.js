/* eslint-disable
    mocha/no-global-tests,
    no-undef
*/
const req = (win) => {
  return new Promise((resolve, reject) => {
    const xhr = new win.XMLHttpRequest()

    xhr.open('GET', 'http://localhost:1515/cached/')
    xhr.onload = () => {
      return resolve(win)
    }

    xhr.onerror = reject

    return xhr.send()
  })
}

const indexedDB = (win) => {
  return new Promise((resolve, reject) => {
    const DBOpenRequest = win.indexedDB.open('toDoList', 1)

    DBOpenRequest.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('toDoList')
    }

    // close the connection so it can't block the browser state reset
    // from deleting the database
    DBOpenRequest.onsuccess = (e) => {
      e.target.result.close()
      resolve(win)
    }

    DBOpenRequest.onerror = () => reject(DBOpenRequest.error)
  })
}

const swReq = (win) => {
  return win.navigator?.serviceWorker?.ready.then(() => win)
}

it('makes cached request', () => {
  cy.visit('http://localhost:1515/browser_reset.html')
  .then(req) // this creates the disk cache
  .then(indexedDB) // this creates the indexedDB
  // serviceWorker.ready only resolves once the worker installs and activates.
  // On Firefox that includes the install handler's network fetch + cache
  // population, which can exceed the 4s default command timeout under CI load.
  .then({ timeout: 30000 }, swReq) // this creates the service worker
})

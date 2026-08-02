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
    const DBOpenRequest = win.indexedDB.open('toDoList')

    DBOpenRequest.onsuccess = (e) => {
      const db = e.target.result

      try {
        expect(db.objectStoreNames.contains('toDoList')).to.be.false
        resolve(win)
      } catch (err) {
        reject(err)
      } finally {
        db.close()
      }
    }

    DBOpenRequest.onerror = () => reject(DBOpenRequest.error)
  })
}

const swReq = (win) => {
  return win.navigator?.serviceWorker?.ready.then(() => win)
}

it('makes cached request', () => {
  cy.visit('http://localhost:1515/browser_reset.html')
  .then(req) // this should hit our server even though cached in the first spec
  .then(indexedDB) // this ensures the indexedDB is empty
  // After the browser state reset the worker is re-registered from scratch, so
  // serviceWorker.ready must wait for a fresh install + activate. On Firefox that
  // can exceed the 4s default command timeout under CI load.
  .then({ timeout: 30000 }, swReq) // this ensures the service worker is not registered
})

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

      expect(db.objectStoreNames.contains('toDoList')).to.be.false

      resolve(win)
    }
  })
}

const swReq = (win) => {
  return win.navigator?.serviceWorker?.ready.then(() => win)
}

it('makes cached request', () => {
  cy.visit('http://localhost:1515/browser_reset.html')
  .then(req) // this should hit our server even though cached in the first spec
  .then(indexedDB) // this ensures the indexedDB is empty
  .then(swReq) // this ensures the service worker is not registered
})

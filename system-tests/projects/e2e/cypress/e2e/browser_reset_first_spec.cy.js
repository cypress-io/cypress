/* eslint-disable
    mocha/no-top-level-tests,
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

// Opening a database writes its files to disk, which slows down sharply on a
// busy CI machine, so these steps get a longer timeout than the default.
const indexedDBTimeout = 15000

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

const iframeIndexedDB = (query) => {
  return (win) => {
    return new Promise((resolve, reject) => {
      const iframe = win.document.createElement('iframe')

      win.addEventListener('message', function onMessage ({ data }) {
        if (data?.type !== 'browser-reset-iframe') return

        win.removeEventListener('message', onMessage)

        return data.error ? reject(new Error(data.error)) : resolve(data.hasStore)
      })

      iframe.src = `http://localhost:1516/browser_reset_iframe.html${query}`
      win.document.body.appendChild(iframe)
    })
  }
}

it('makes cached request', () => {
  cy.visit('http://localhost:1515/browser_reset.html')
  .then(req) // this creates the disk cache
  .then({ timeout: indexedDBTimeout }, indexedDB) // this creates the indexedDB
  .then(swReq) // this creates the service worker
  .then({ timeout: indexedDBTimeout }, iframeIndexedDB('?write')) // this creates an indexedDB on an origin that is never visited
  .should('be.true')
})

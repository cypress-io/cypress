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
  .then(req) // this should hit our server even though cached in the first spec
  .then(indexedDB) // this ensures the indexedDB is empty
  .then(swReq) // this ensures the service worker is not registered
  .then(iframeIndexedDB('')) // this ensures the never-visited origin's indexedDB is empty
  .should('be.false')
})

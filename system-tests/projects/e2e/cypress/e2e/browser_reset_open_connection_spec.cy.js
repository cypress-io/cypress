/* eslint-disable
    mocha/no-top-level-tests,
    no-undef
*/
// Leaves IndexedDB the way an app often does when its spec ends: a connection
// still open, a write still in flight, and an upgrade queued behind that
// connection. The next spec's open must not wait on any of them.

// IndexedDB writes its files to disk on open, which can take seconds on a
// loaded CI machine, so these steps get more than the default command timeout.
const indexedDBTimeout = 15000

const openAndKeepConnection = (win) => {
  return new Promise((resolve, reject) => {
    const DBOpenRequest = win.indexedDB.open('toDoList', 1)

    DBOpenRequest.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('toDoList')
    }

    DBOpenRequest.onsuccess = (e) => {
      const db = e.target.result
      const transaction = db.transaction('toDoList', 'readwrite')

      for (let i = 0; i < 100; i++) {
        transaction.objectStore('toDoList').put({ title: `Buy groceries ${i}`, notes: 'x'.repeat(10000) }, i)
      }

      resolve(win)
    }

    DBOpenRequest.onerror = () => reject(DBOpenRequest.error)
  })
}

// An upgrade rather than a deleteDatabase, which would remove the database by
// itself once the connection closes and so pass without any reset.
const queueBlockedUpgrade = (win) => {
  return new Promise((resolve, reject) => {
    const DBOpenRequest = win.indexedDB.open('toDoList', 2)

    DBOpenRequest.onblocked = () => resolve(win)
    DBOpenRequest.onsuccess = () => reject(new Error('indexedDB.open(\'toDoList\', 2) succeeded although a connection is still open'))
    DBOpenRequest.onerror = () => reject(DBOpenRequest.error)
  })
}

it('leaves an IndexedDB connection open', () => {
  cy.visit('http://localhost:1515/browser_reset.html')
  .then({ timeout: indexedDBTimeout }, openAndKeepConnection)
  .then({ timeout: indexedDBTimeout }, queueBlockedUpgrade)
})

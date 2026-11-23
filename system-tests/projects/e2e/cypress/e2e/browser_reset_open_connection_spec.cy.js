/* eslint-disable
    mocha/no-top-level-tests,
    no-undef
*/
// Leaves IndexedDB the way an app often does when its spec ends: a connection
// still open, a write still in flight, and an upgrade queued behind that
// connection. The next spec's open must not wait on any of them.

// Opening a database writes its files to disk, which slows down sharply on a
// busy CI machine, so these steps get a longer timeout than the default.
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

// Queues an upgrade rather than a deleteDatabase: a queued delete runs on its
// own once the page closes the connection, so the next spec would find the
// database gone even if the reset never cleared it.
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

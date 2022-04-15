import { runSpec } from './spec-loader'

export function getMochaEvents (fileName, done) {
  runSpec({ fileName }).then(async (win: Cypress.AUTWindow) => {
    win.getEventManager().localBus.once('cypress:in:cypress:run:complete', done)
  })
}

const getEventNames = (e) => e[1]

export function assertEventNames (filename, snapshot, events) {
  try {
    expect(events.map(getEventNames)).to.eql(snapshot)
  } catch (e) {
    /* eslint-disable no-console */
    console.log('Snapshot failed. Add the following into the snapshot file to update:')
    console.log(JSON.stringify({ [filename]: events.map(getEventNames) }, null, 2).replace(/"/g, '\''))
    throw e
  }
}

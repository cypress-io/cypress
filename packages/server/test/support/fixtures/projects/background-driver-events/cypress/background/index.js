/* eslint-disable no-console */

module.exports = (on) => {
  on('test:run:start', (test) => {
    console.log('test:run:start:', test.title)
    throw new Error('Error thrown synchronously from "test:run:start". Should be ignored.')
  })

  on('internal:commandEnqueue', (command) => {
    console.log('internal:commandEnqueue:', command.name, command.args.join(', '))
  })

  on('internal:commandStart', (command) => {
    console.log('internal:commandStart:', command.name, command.args.join(', '))
  })

  // only do this once or it's a lot of logging
  let retryCalled = false

  on('internal:commandRetry', (retry) => {
    if (retryCalled) return

    retryCalled = true
    console.log('internal:commandRetry:', retry.name, retry.error.message)
  })

  on('internal:commandEnd', (command) => {
    console.log('internal:commandEnd:', command.name, command.args.join(', '))
  })

  on('test:run:end', (test) => {
    console.log('test:run:end:', test.title)

    return Promise.reject(new Error('Error thrown in promise from "test:run:end". Should be ignored.'))
  })
}

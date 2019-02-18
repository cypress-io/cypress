/* eslint-disable no-console */

module.exports = (on) => {
  on('test:start', (test) => {
    console.log('test:start:', test.title)
    throw new Error('Error thrown synchronously from "test:start". Should be ignored.')
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

  on('test:end', (test) => {
    console.log('test:end:', test.title)

    return Promise.reject(new Error('Error thrown in promise from "test:end". Should be ignored.'))
  })
}

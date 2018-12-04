/* eslint-disable no-console */

module.exports = (on) => {
  on('test:run:start', (test) => {
    console.log('test:run:start:', test.title)
    throw new Error('Error thrown synchronously from "test:run:start". Should be ignored.')
  })

  on('command:enqueued', (command) => {
    console.log('command:enqueued:', command.name, command.args.join(', '))
  })

  on('command:start', (command) => {
    console.log('command:start:', command.name, command.args.join(', '))
  })

  // only do this once or it's a lot of logging
  let retryCalled = false

  on('command:retry', (retry) => {
    if (retryCalled) return

    retryCalled = true
    console.log('command:retry:', retry.name, retry.error.message)
  })

  on('command:end', (command) => {
    console.log('command:end:', command.name, command.args.join(', '))
  })

  on('test:run:end', (test) => {
    console.log('test:run:end:', test.title)

    return Promise.reject(new Error('Error thrown in promise from "test:run:end". Should be ignored.'))
  })
}

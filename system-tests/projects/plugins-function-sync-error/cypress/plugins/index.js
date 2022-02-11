module.exports = (on, config) => {
  const err = new Error('Function sync error from plugins file')

  err.name = 'FunctionSyncError'

  throw err
}

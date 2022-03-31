const globalExceptionHandler = async (err) => {
  await require('./errors').logException(err)
  process.exit(1)
}

process.removeAllListeners('unhandledRejection')
process.once('unhandledRejection', globalExceptionHandler)
process.removeAllListeners('uncaughtException')
process.once('uncaughtException', globalExceptionHandler)

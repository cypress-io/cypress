require('@packages/server')

if (process.env.CYPRESS_INTERNAL_DEV_WATCH) {
  process.on('message', (msg) => {
    if (msg === 'close') {
      process.exit(0)
    }
  })
}

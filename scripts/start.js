require('@packages/server')

if (process.env.CYPRESS_INTERNAL_DEV_WATCH) {
  process.on('message', (msg) => {
    if (msg === 'gulpWatcherClose') {
      // Delay after a tick so we can
      // handle close signals elsewhere
      setTimeout(() => {
        process.exit(0)
      })
    }
  })
}

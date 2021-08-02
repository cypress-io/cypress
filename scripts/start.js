process.env.GRAPHQL_CODEGEN = 'true'
require('@packages/server')

if (process.argv.includes('--devWatch')) {
  process.on('message', (msg) => {
    if (msg === 'close') {
      process.exit(0)
    }
  })
}

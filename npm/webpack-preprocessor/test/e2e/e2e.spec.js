const { runTest } = require('./helpers')
const path = require('path')
const globby = require('globby')

describe('can test', async () => {
  // runs every test in cypress/tests/e2e as its own test
  // the comment above the test will determine the assertion on the results
  globby.sync(path.join(__dirname, '../../cypress/tests/e2e/**/*'))
  .map((v) => {
    const filename = path.relative(process.cwd(), v)

    it(`test: ${filename}`, async () => {
      await runTest({
        spec: v,
      })
    })
  })
})

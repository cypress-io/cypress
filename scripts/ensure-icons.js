const fs = require('fs-extra')
const path = require('path')

function delay (n) {
  return new Promise((resolve) => setTimeout(resolve, n))
}

async function waitUntilExists (dir, { freq, maxAttempts }, numAttempts = 0) {
  const exists = await fs.pathExists(dir)

  if (exists) {
    return true
  }

  if (numAttempts > maxAttempts) {
    throw Error(`Failed to detect path at ${dir} after ${maxAttempts}.`)
  }

  console.log(`[@packages/runner/webpack.config.ts]: ${dir} not found. Will check again in ${freq}ms. Attempt: ${numAttempts}/${maxAttempts}`)

  await delay(freq)

  return waitUntilExists(dir, { freq, maxAttempts }, numAttempts + 1)
}

async function waitUntilIconsBuilt () {
  await waitUntilExists(path.join(__dirname, '..', 'packages', 'icons', 'dist', 'favicon'), { freq: 1000, maxAttempts: 10 })
}

module.exports = {
  waitUntilIconsBuilt,
}

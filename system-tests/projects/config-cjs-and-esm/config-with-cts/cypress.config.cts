interface E2EOptions {
  supportFile: false
}

const e2e: E2EOptions = { supportFile: false }

// require must be present within a CJS context
require

module.exports = { e2e }

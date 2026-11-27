// `interface` only compiles as TypeScript and `require` is not defined in ESM,
// so this config loads only when `.cts` is loaded as CommonJS TypeScript.
interface E2EOptions {
  supportFile: false
}

const e2e: E2EOptions = { supportFile: false }

require

module.exports = { e2e }

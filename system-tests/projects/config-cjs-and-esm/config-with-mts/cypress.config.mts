// `interface` only compiles as TypeScript and `import.meta` is a syntax error
// outside ESM, so this config loads only when `.mts` is loaded as ESM TypeScript.
interface E2EOptions {
  supportFile: false
}

const e2e: E2EOptions = { supportFile: false }

import.meta.resolve

export default { e2e }

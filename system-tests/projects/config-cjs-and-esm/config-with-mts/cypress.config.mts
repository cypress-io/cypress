interface E2EOptions {
  supportFile: false
}

const e2e: E2EOptions = { supportFile: false }

// import.meta.resolve must be present within an ESM context
import.meta.resolve

export default { e2e }

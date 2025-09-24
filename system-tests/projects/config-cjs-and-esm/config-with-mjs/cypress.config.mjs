import { defineConfig } from 'cypress'
import { resolve } from 'node:path'

const root = import.meta.dirname

// should fail if not loading ESM correctly
resolve(root, 'dist')

export default defineConfig({
  e2e: { supportFile: false },
})

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    // binary/util/upload.js is CommonJS and requires TypeScript modules through Node, which vite doesn't transform
    setupFiles: ['@packages/ts/register'],
    include: ['unit/**/*.spec.ts'],
    environment: 'node',
    deps: {
      // Vitest's default-export interop never returns for check-more-types' webpack UMD bundle,
      // so take Node's own default export, which is `module.exports` for CommonJS
      interopDefault: false,
    },
  },
})

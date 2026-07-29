import { existsSync } from 'fs'
import { dirname, extname, resolve } from 'path'
import { configDefaults, defineConfig } from 'vitest/config'

// The specs and scripts are CommonJS and load TypeScript modules with
// extensionless `require()` calls (e.g. `require('../../binary/s3-api')`).
// vite-node's `require` shim resolves those with Node semantics, which do not
// try a `.ts` extension. Map extensionless relative ids to their `.ts` sibling
// so both direct and transitive requires resolve as they did under ts-node.
const resolveTsRequires = {
  name: 'resolve-ts-requires',
  enforce: 'pre' as const,
  resolveId (source: string, importer: string | undefined) {
    if (!importer || extname(source) || !source.startsWith('.')) {
      return null
    }

    const candidate = `${resolve(dirname(importer), source)}.ts`

    return existsSync(candidate) ? candidate : null
  },
}

export default defineConfig({
  plugins: [resolveTsRequires],
  test: {
    include: ['unit/**/*spec.{js,ts}'],
    // TODO: move-binaries-spec eagerly imports move-binaries.ts, whose heavy
    // gulp/aws CommonJS dependency graph deadlocks under vite-node's ESM
    // interop at collection time. Re-enable once that module graph is
    // untangled (or the spec mocks the offending siblings).
    exclude: [...configDefaults.exclude, 'unit/binary/move-binaries-spec.js'],
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    reporters: [
      'default',
      ['junit', { suiteName: 'Scripts Unit Tests', outputFile: '/tmp/cypress/junit/scripts-test-results.xml' }],
    ],
  },
})

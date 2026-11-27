import { createRequire } from 'module'
import path from 'path'
import { defineConfig } from 'vitest/config'

// The config bundler's own `require` resolves with import conditions
const nodeRequire = createRequire(__filename)

// The app loads data-context through a CommonJS require hook. Vite resolves these packages
// to their ESM builds instead, which breaks `import { Server } from 'ws'` (only the CJS build
// exports `Server`) and loads a second copy of graphql next to the one that externalized
// deps such as @graphql-tools require ("Cannot use GraphQLObjectType from another module or realm")
const cjsEntries = ['graphql', 'ws'].map((name) => {
  return { find: new RegExp(`^${name}$`), replacement: nodeRequire.resolve(name) }
})

export default defineConfig({
  resolve: {
    alias: [
      ...cjsEntries,
      // Its CJS entry requires a .ts file, which only loads under the app's TypeScript require hook
      { find: '@packages/example', replacement: path.join(__dirname, '../example/lib/example.ts') },
    ],
  },
  test: {
    include: ['test/**/*.spec.ts'],
    environment: 'node',
    // ProjectLifecycleManager calls process.chdir, which worker threads reject
    // and which would leak between specs sharing a process
    pool: 'forks',
    fileParallelism: false,
  },
})

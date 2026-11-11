import fs from 'fs'
import path from 'path'
import type { ESLint, Linter } from 'eslint'
import globals from 'globals'

// The plugin's types export a string-named `"module.exports"`, which the
// repo's TypeScript and import-x's parser can't read, so load it untyped
const n: ESLint.Plugin = require('eslint-plugin-n')

const repoRoot = path.resolve(__dirname, '../../..')

// ESLint loads configs synchronously, so the floors can't be read async
// eslint-disable-next-line no-restricted-syntax
const readRepoFile = (file: string) => fs.readFileSync(path.join(repoRoot, file), 'utf8')

/**
 * The Node that dev tooling and the bundled app run on. Electron's embedded
 * Node is the bundled app's runtime, and it is no lower than `.node-version`
 * for the Electron pinned in the root `package.json`; lower this to Electron's
 * Node if a bump ever leaves it behind.
 */
const bundledNodeVersion = `>=${readRepoFile('.node-version').trim()}`

/** The user's Node, which runs the `cypress` CLI and the config child process */
const userNodeVersion: string = JSON.parse(readRepoFile('cli/package.json')).engines.node

/**
 * Opt-in Node checks for Node-side workspaces: no runtime APIs or syntax
 * above the floor, and no imports of packages the workspace doesn't declare.
 * Spread it after `baseConfig`. The floor is `bundledNodeVersion`; spread
 * `userNodeConfig` after it, scoped with `files`, for code that runs on the
 * user's Node.
 */
export const nodeConfig: Linter.Config[] = [
  {
    files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
    plugins: {
      n,
    },
    languageOptions: {
      // The plugin only checks globals such as `process` and `Buffer` that
      // resolve in scope
      globals: globals.node,
    },
    settings: {
      n: {
        version: bundledNodeVersion,
      },
    },
    rules: {
      'n/no-unsupported-features/node-builtins': 'error',
      'n/no-unsupported-features/es-builtins': 'error',
      'n/no-unsupported-features/es-syntax': 'error',
      'n/no-extraneous-import': 'error',
      'n/no-extraneous-require': 'error',
    },
  },
  {
    // Declarations emit no runtime code, and the rules would read DOM globals
    // such as `Storage` as Node's
    files: ['**/*.d.ts'],
    rules: {
      'n/no-unsupported-features/node-builtins': 'off',
      'n/no-unsupported-features/es-builtins': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
    },
  },
]

/**
 * Lets `files` import sibling workspaces they don't declare, for imports whose
 * declaration would close a dependency cycle. nx breaks a cycle by dropping one
 * of its edges, which can build a package before one it compiles against.
 */
export const undeclaredWorkspaceImports = (files: string[], workspaces: string[]): Linter.Config => {
  return {
    files,
    rules: {
      'n/no-extraneous-import': ['error', { allowModules: workspaces }],
      'n/no-extraneous-require': ['error', { allowModules: workspaces }],
    },
  }
}

/** Lowers `nodeConfig`'s floor to the user's Node. Spread it after `nodeConfig`. */
export const userNodeConfig: Linter.Config = {
  settings: {
    n: {
      version: userNodeVersion,
    },
  },
}

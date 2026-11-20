// The plugin only exposes its types through `exports`, which the `node` module
// resolution of several workspaces that type-check this package ignores.
declare module 'eslint-plugin-mocha' {
  import type { ESLint, Linter } from 'eslint'

  // Safe because v12's `configs.recommended` is a single flat config object;
  // the plugin's own types also allow a legacy config or an array
  const plugin: ESLint.Plugin & {
    configs: {
      recommended: Linter.Config
    }
  }

  export default plugin
}

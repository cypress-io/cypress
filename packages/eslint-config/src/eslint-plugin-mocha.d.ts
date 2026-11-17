// The plugin only exposes its types through `exports`, which the `node` module
// resolution of several workspaces that type-check this package ignores.
declare module 'eslint-plugin-mocha' {
  import type { ESLint } from 'eslint'

  const plugin: ESLint.Plugin

  export default plugin
}

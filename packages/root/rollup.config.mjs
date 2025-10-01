import json from '@rollup/plugin-json'

export default {
  input: 'index.ts',
  // inlines the root package.json into the bundle
  plugins: [json()],
}

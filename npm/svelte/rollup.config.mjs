import { createEntries } from '@cypress/mount-utils/create-rollup-entry.mjs'

const config = {
  external: [
    'svelte',
  ],
}

// updated respectExternal to false due to this issue: https://github.com/Swatinem/rollup-plugin-dts/issues/162#issuecomment-1702374232
export default createEntries({ formats: ['es', 'cjs'], input: 'src/index.ts', dtsOptions: { respectExternal: false }, config })

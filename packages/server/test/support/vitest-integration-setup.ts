import { vi } from 'vitest'

// Vite resolves `graphql` in workspace TypeScript to its ESM build, while node
// hands externalized packages the CJS build; `graphql` rejects types shared
// across the two realms when the schema is built.
vi.mock('graphql', async () => {
  const { createRequire } = await import('module')

  return createRequire(import.meta.url)('graphql')
})

// The same split gives data-context's `import { Server } from 'ws'` the ESM
// wrapper of the root `ws`, which has no `Server` export.
vi.mock('../../../../node_modules/ws/wrapper.mjs', async () => {
  const { createRequire } = await import('module')
  const rootWs = createRequire(import.meta.url)('../../../../node_modules/ws/index.js')

  return { ...rootWs, default: rootWs }
})

if (require.name !== 'customRequire') {
  // Purposefully make this a dynamic require so that it doesn't have the potential to get picked up by snapshotting mechanism
  const hook = './hook'

  require(`@packages/server/${hook}-require`)
}

require('../lib/threads/worker.ts')

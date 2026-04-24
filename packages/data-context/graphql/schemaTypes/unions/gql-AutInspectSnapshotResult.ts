import { unionType } from 'nexus'

export const AutInspectSnapshotResult = unionType({
  name: 'AutInspectSnapshotResult',
  definition (t) {
    t.members(
      'AutInspectSnapshotResponse',
      'AutInspectError',
    )
  },
  resolveType: (obj) => {
    return 'code' in obj ? 'AutInspectError' : 'AutInspectSnapshotResponse'
  },
})

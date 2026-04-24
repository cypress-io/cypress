import { unionType } from 'nexus'

export const AutInspectResult = unionType({
  name: 'AutInspectResult',
  definition (t) {
    t.members(
      'AutInspectResponse',
      'AutInspectError',
    )
  },
  resolveType: (obj) => {
    return 'code' in obj ? 'AutInspectError' : 'AutInspectResponse'
  },
})

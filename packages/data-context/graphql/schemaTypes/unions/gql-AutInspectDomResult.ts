import { unionType } from 'nexus'

export const AutInspectDomResult = unionType({
  name: 'AutInspectDomResult',
  definition (t) {
    t.members(
      'AutInspectDomResponse',
      'AutInspectError',
    )
  },
  resolveType: (obj) => {
    return 'code' in obj ? 'AutInspectError' : 'AutInspectDomResponse'
  },
})

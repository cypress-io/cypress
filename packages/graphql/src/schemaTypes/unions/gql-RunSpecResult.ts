import { unionType } from 'nexus'

export const RunSpecResult = unionType({
  name: 'RunSpecResult',
  definition (t) {
    t.members(
      'RunSpecResponse',
      'RunSpecError',
    )
  },
  resolveType: (obj) => {
    return 'code' in obj ? 'RunSpecError' : 'RunSpecResponse'
  },
})

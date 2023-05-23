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
    // @ts-expect-error
    if (obj.code) {
      return 'RunSpecError'
    }

    return 'RunSpecResponse'
  },
})

import { unionType } from 'nexus'

export const GeneratedSpecResult = unionType({
  name: 'GeneratedSpecResult',
  definition (t) {
    t.members(
      'ScaffoldedFile',
      'GeneratedSpecError',
    )
  },
  resolveType: (obj) => {
    // @ts-expect-error
    if (obj.fileName) {
      return 'GeneratedSpecError'
    }

    return 'ScaffoldedFile'
  },
})

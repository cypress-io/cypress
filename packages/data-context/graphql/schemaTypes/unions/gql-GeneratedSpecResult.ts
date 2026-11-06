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
    // @ts-expect-error - only `GeneratedSpecError` has `fileName`, which is what this check relies on
    if (obj.fileName) {
      return 'GeneratedSpecError'
    }

    return 'ScaffoldedFile'
  },
})

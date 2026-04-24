import { unionType } from 'nexus'

export const StudioInitResult = unionType({
  name: 'StudioInitResult',
  definition (t) {
    t.members(
      'StudioInitResponse',
      'StudioInitError',
    )
  },
  resolveType: (obj) => {
    return 'code' in obj ? 'StudioInitError' : 'StudioInitResponse'
  },
})

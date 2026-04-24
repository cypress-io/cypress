import { unionType } from 'nexus'

export const InspectCommandInfoResult = unionType({
  name: 'InspectCommandInfoResult',
  definition (t) {
    t.members(
      'InspectCommandInfoResponse',
      'InspectCommandInfoError',
    )
  },
  resolveType: (obj) => {
    return 'code' in obj ? 'InspectCommandInfoError' : 'InspectCommandInfoResponse'
  },
})

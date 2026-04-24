import { unionType } from 'nexus'

export const InspectPinCommandResult = unionType({
  name: 'InspectPinCommandResult',
  definition (t) {
    t.members(
      'InspectPinCommandResponse',
      'InspectPinCommandError',
    )
  },
  resolveType: (obj) => {
    return 'code' in obj ? 'InspectPinCommandError' : 'InspectPinCommandResponse'
  },
})

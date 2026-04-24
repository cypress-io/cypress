import { objectType } from 'nexus'

export const InspectPinCommandResponse = objectType({
  name: 'InspectPinCommandResponse',
  description: 'Successful result of an inspectPinCommand mutation.',
  definition (t) {
    t.nonNull.string('logId', {
      description: 'Driver-assigned log id that was pinned.',
    })
  },
})

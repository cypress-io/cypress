import { objectType } from 'nexus'
import { CommandLog } from './gql-InspectSnapshot'

export const CommandInfo = objectType({
  name: 'CommandInfo',
  description: 'Detail view of a single command: the `CommandLog` entry plus its safe-stringified `consoleProps`. Fetched without side effects — unlike `pinnedCommand`, reading this does not pin the command in the reporter UI.',
  definition (t) {
    t.nonNull.field('command', {
      type: CommandLog,
      description: 'Full metadata for the command — the matching entry from `activeRun.commands`.',
    })

    t.string('consolePropsJson', {
      description: 'Safely-serialized `consoleProps` dump for this command. Null if the driver could not produce console props (e.g. after memory cleanup).',
    })
  },
})

export const InspectCommandInfoResponse = objectType({
  name: 'InspectCommandInfoResponse',
  description: 'Successful result of an `inspectCommandInfo` query — one `CommandInfo` entry per requested log id, in request order.',
  definition (t) {
    t.nonNull.list.nonNull.field('items', {
      type: CommandInfo,
    })
  },
})

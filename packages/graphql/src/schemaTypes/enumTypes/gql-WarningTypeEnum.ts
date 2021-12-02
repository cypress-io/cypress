import { enumType } from 'nexus'

export const WarningType = enumType({
  name: 'WarningType',
  description: 'The origin of the warning, to show in context',
  members: [
    {
      name: 'browser',
      description: 'Happens in relation to a browser being chosen',
    },
    {
      name: 'config',
      description: 'Happens in relation to config sourcing',
    },
  ],
})

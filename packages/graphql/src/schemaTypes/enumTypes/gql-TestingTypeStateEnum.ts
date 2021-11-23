import { enumType } from 'nexus'

export const TestingTypeState = enumType({
  name: 'TestingTypeState',
  description: 'Current state of a given testing type',
  members: [
    {
      name: 'LOADING',
      description: 'We are loading the config',
    },
    {
      name: 'NEW',
      description: 'We have not yet setup this testing type yet',
    },
    {
      name: 'NEEDS_CHANGES',
      description: 'We have detected errors when looking at the configuration and need to suggest changes',
    },
    {
      name: 'READY',
      description: 'Everything looks good and we can move on to finding browsers',
    },
  ],
})

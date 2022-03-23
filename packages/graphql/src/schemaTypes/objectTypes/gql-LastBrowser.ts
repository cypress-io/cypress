import { objectType } from 'nexus'

export const LastBrowser = objectType({
  name: 'LastBrowser',
  description: 'An object that uniquely identifies the last chosen browser in interactive mode.',
  definition (t) {
    t.nonNull.string('name')
    t.nonNull.string('channel')
  },
})

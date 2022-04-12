import { objectType } from 'nexus'

export const Editor = objectType({
  name: 'Editor',
  description: 'Represents an editor on the local machine',
  definition (t) {
    t.nonNull.string('id')

    t.nonNull.string('name', {
      description: 'name of editor',
    })

    t.string('binary', {
      description: 'Binary that opens the editor',
    })
  },
})

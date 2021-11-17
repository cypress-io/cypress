import { enumType, objectType } from 'nexus'
import { editorIds } from '@packages/types'

const EditorIdEnum = enumType({
  name: 'EditorId',
  description: 'Editor id',
  members: editorIds,
})

export const Editor = objectType({
  name: 'Editor',
  description: 'Represents an editor on the local machine',
  definition (t) {
    t.nonNull.field('id', {
      type: EditorIdEnum,
    })

    t.nonNull.string('name', {
      description: 'name of editor',
    })

    t.nonNull.string('binary', {
      description: 'Binary that opens the editor',
    })
  },
})

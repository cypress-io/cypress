import { inputObjectType } from 'nexus'

export const FileDetailsInput = inputObjectType({
  name: 'FileDetailsInput',
  definition (t) {
    t.nonNull.string('filePath', {
      description: 'When we open a file we take a filePath, either relative to the project root, or absolute on disk',
    })

    t.int('column')
    t.int('line')
  },
})

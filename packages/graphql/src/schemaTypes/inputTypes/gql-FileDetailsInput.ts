import { inputObjectType } from 'nexus'

export const FileDetailsInput = inputObjectType({
  name: 'FileDetailsInput',
  definition (t) {
    t.nonNull.string('absolute')
    t.int('column')
    t.int('line')
  },
})

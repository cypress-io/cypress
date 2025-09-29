import { objectType } from 'nexus'
import path from 'path'
import { FileParts } from './gql-FileParts'

export const CodeFrame = objectType({
  name: 'CodeFrame',
  description: 'A code frame to display for a file, used when displaying code related to errors',
  definition (t) {
    t.int('line', {
      description: 'The line number of the code snippet to display',
    })

    t.int('column', {
      description: 'The column of the error to display',
    })

    t.string('codeBlock', {
      description: 'Source of the code frame to display',
    })

    t.nonNull.field('file', {
      type: FileParts,
      resolve (source, args, ctx) {
        return { absolute: source.absolute }
      },
    })
  },
  sourceType: {
    module: path.join(__dirname, '../../../src/sources/ErrorDataSource.ts'),
    export: 'CodeFrameShape',
  },
})

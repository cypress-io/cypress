import { objectType } from 'nexus'
import { FileParts } from '.'
import { CodeGenGenResultTypeEnum, CodeGenResultStatusEnum } from '../enumTypes/gql-CodeGenResultEnum'

const CodeGenResult = objectType({
  name: 'CodeGenResult',
  description: 'Represents a spec on the file system',
  node: 'file',
  definition (t) {
    t.nonNull.field('status', {
      type: CodeGenResultStatusEnum,
    })

    t.nonNull.field('type', {
      type: CodeGenGenResultTypeEnum,
    })

    t.nonNull.string('file', {
      description: 'Absolute path of generated file.',
    })

    t.nonNull.string('content', {
      description: 'Content of generated file.',
    })
  },
})

export const CodeGenResultWithFileParts = objectType({
  name: 'CodeGenResultWithFileParts',
  description: 'Result of generated file with file parts',
  definition (t) {
    t.nonNull.field('codeGenResult', {
      type: CodeGenResult,
    })

    t.nonNull.field('fileParts', {
      type: FileParts,
    })
  },
})

import { enumType } from 'nexus'

export const CodeGenResultStatusEnum = enumType({
  name: 'CodeGenStatus',
  members: ['add', 'overwrite', 'skipped'],
})

export const CodeGenGenResultTypeEnum = enumType({
  name: 'CodeGenGenResultType',
  members: ['text', 'binary'],
})

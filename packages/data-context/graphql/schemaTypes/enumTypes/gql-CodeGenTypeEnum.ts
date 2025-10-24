import { enumType } from 'nexus'

export const CodeGenTypeEnum = enumType({
  name: 'CodeGenType',
  members: ['component', 'componentEmpty', 'e2e', 'e2eExamples'],
})

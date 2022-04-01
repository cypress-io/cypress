import { enumType } from 'nexus'

export const CodeGenTypeEnum = enumType({
  name: 'CodeGenType',
  members: ['component', 'e2e', 'scaffoldIntegration'],
})

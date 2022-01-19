import { enumType } from 'nexus'

export const CodeGenTypeEnum = enumType({
  name: 'CodeGenType',
  members: ['story', 'component', 'e2e', 'scaffoldIntegration'],
})

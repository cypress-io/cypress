import { enumType } from 'nexus'

export const CodeGenTypeEnum = enumType({
  name: 'CodeGenType',
  members: ['story', 'component', 'integration', 'scaffoldIntegration'],
})

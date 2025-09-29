import { enumType } from 'nexus'

export const FileExtensionEnum = enumType({
  name: 'FileExtensionEnum',
  members: ['js', 'ts', 'jsx', 'tsx'],
})

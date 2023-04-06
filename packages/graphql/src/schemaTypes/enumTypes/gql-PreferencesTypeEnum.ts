import { enumType } from 'nexus'

export const PreferencesTypeEnum = enumType({
  name: 'PreferencesTypeEnum',
  members: ['global', 'project'],
})

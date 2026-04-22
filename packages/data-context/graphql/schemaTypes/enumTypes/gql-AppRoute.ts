import { enumType } from 'nexus'

export const AppRouteEnum = enumType({
  name: 'AppRoute',
  description: 'Derived high-level route of the open-mode app, exposed for CLI inspection.',
  members: ['INTRO', 'TESTING_TYPE_SELECTION', 'BROWSER_SELECTION', 'SPEC_LIST', 'SPEC_RUNNING', 'ERROR'],
})

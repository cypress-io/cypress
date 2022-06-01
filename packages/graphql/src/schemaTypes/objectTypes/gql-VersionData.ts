import { objectType } from 'nexus'
import { Version } from './gql-Version'

export const VersionData = objectType({
  name: 'VersionData',
  description: 'Version of Cypress and release date',
  definition (t) {
    t.nonNull.field('latest', {
      type: Version,
      description: 'latest version of cypress',
    })

    t.nonNull.field('current', {
      type: Version,
      description: 'current version of cypress you are using',
    })
  },
})

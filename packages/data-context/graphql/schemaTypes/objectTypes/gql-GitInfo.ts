import { objectType, enumType } from 'nexus'
import { gitStatusType } from '@packages/types'

export const GitInfoStatusTypeEnum = enumType({
  name: 'GitInfoStatusType',
  members: gitStatusType,
})

export const GitInfo = objectType({
  name: 'GitInfo',
  description: 'Git information about a spec file',
  definition (t) {
    t.string('author', {
      description: 'Last person to change the file in git',
    })

    t.string('lastModifiedTimestamp', {
      description: 'last modified timestamp, eg 2021-09-14 13:43:19 +1000',
    })

    t.string('lastModifiedHumanReadable', {
      description: 'last modified as a pretty string, eg 2 days ago',
    })

    t.field('statusType', {
      type: GitInfoStatusTypeEnum,
      description: 'status type - created or modified',
    })

    t.string('subject', {
      description: 'subject for latest commit',
    })

    t.string('shortHash', {
      description: 'short hash for latest commit',
    })
  },
})

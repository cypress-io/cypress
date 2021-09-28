import { objectType } from 'nexus'
import { SpecTypeEnum } from '../enumTypes'
import { GitInfo } from './gql-GitInfo'

export const Spec = objectType({
  name: 'Spec',
  description: 'Represents a spec on the file system',
  definition (t) {
    t.nonNull.field('specType', {
      type: SpecTypeEnum,
      description: 'Type of spec'
    })

    t.nonNull.string('absolute', {
      description: 'Absolute path to spec'
    })

    t.nonNull.string('relative', {
      description: 'Relative path to spec'
    })

    t.nonNull.string('name', {
      description: 'Name of spec file'
    })

    t.field('gitInfo', {
      type: GitInfo,
      description: 'Git information about the spec file',
    })
  }
})
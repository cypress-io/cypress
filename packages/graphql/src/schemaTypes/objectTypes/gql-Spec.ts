import { objectType } from 'nexus'
import { SpecTypeEnum } from '../enumTypes'
import { GitInfo } from './gql-GitInfo'

export const Spec = objectType({
  name: 'Spec',
  description: 'Represents a spec on the file system',
  node: 'absolute',
  definition (t) {
    t.nonNull.field('specType', {
      type: SpecTypeEnum,
      description: 'Type of spec (e.g. component | integration)',
    })

    t.nonNull.string('absolute', {
      description: 'Absolute path to spec (e.g. /Users/jess/my-project/src/component/MySpec.test.tsx)',
    })

    t.nonNull.string('relative', {
      description: 'Relative path to spec (e.g. src/component/MySpec.test.tsx)',
    })

    t.nonNull.string('baseName', {
      description: 'Full name of spec file (e.g. MySpec.test.tsx)',
    })

    t.nonNull.string('name', {
      description: 'Full name of spec file (e.g. MySpec.test.tsx)',
    })

    t.nonNull.string('fileExtension', {
      description: 'The file extension (e.g. tsx, jsx)',
    })

    t.nonNull.string('specFileExtension', {
      description: `The spec file's extension, including "spec" pattern (e.g. .spec.tsx, -spec.tsx, -test.tsx)`,
    })

    t.nonNull.string('fileName', {
      description: `The first part of the file, without extensions (e.g. MySpec)`,
    })

    t.field('gitInfo', {
      type: GitInfo,
      description: 'Git information about the spec file',
      resolve: async (source, args, ctx) => {
        return ctx.git.gitInfo(source.absolute)
      },
    })
  },
})

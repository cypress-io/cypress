import { objectType } from 'nexus'

export const FileParts = objectType({
  name: 'FileParts',
  description: 'Represents a spec on the file system',
  node: 'absolute',
  definition (t) {
    t.nonNull.string('absolute', {
      description: 'Absolute path to spec (e.g. /Users/jess/my-project/src/component/MySpec.test.tsx)',
    })

    t.nonNull.string('relative', {
      description: 'Relative path to spec (e.g. src/component/MySpec.test.tsx)',
    })

    t.nonNull.string('baseName', {
      description: 'Full name of spec file (e.g. MySpec.test.tsx) without the spec extension',
    })

    t.nonNull.string('name', {
      description: 'Full name of spec file (e.g. MySpec.test.tsx)',
    })

    t.nonNull.string('fileExtension', {
      description: `The spec file's extension, including "spec" pattern (e.g. .spec.tsx, -spec.tsx, -test.tsx)`,
    })

    t.nonNull.string('fileName', {
      description: `The first part of the file, without extensions (e.g. MySpec)`,
    })
  },
})

import { objectType } from 'nexus'
import path from 'path'

export interface FilePartsShape {
  absolute: string
  // For when we're merging the file
  contents?: string
}

export const FileParts = objectType({
  name: 'FileParts',
  description: 'Represents a file on the file system',
  node: 'absolute',
  definition (t) {
    t.nonNull.string('absolute', {
      description: 'Absolute path to file (e.g. /Users/jess/my-project/src/component/MySpec.test.tsx)',
    })

    t.nonNull.string('relative', {
      description: 'Relative path to file (e.g. src/component/MySpec.test.tsx)',
      resolve (root, args, ctx) {
        return path.relative(ctx.currentProject || '', root.absolute)
      },
    })

    t.nonNull.string('baseName', {
      description: 'Full name of the file (e.g. MySpec.test.tsx)',
      resolve (root, args, ctx) {
        return path.basename(root.absolute)
      },
    })

    t.nonNull.string('name', {
      description: 'Full name of spec file (e.g. MySpec.test.tsx)',
      resolve (root) {
        return path.basename(root.absolute)
      },
    })

    t.nonNull.string('fileExtension', {
      description: `The file's extension`,
      resolve (root) {
        return path.extname(root.absolute)
      },
    })

    t.nonNull.string('fileName', {
      description: `The first part of the file, without extensions (e.g. MySpec)`,
      resolve (root) {
        return path.basename(root.absolute).split('.')[0] ?? ''
      },
    })

    t.nonNull.string('contents', {
      description: `The contents of the file`,
      resolve (root, args, ctx) {
        return root.contents || ctx.file.readFile(root.absolute)
      },
    })
  },
  sourceType: {
    module: __filename,
    export: 'FilePartsShape',
  },
})

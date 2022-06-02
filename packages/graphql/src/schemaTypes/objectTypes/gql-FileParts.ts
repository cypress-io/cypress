import { objectType } from 'nexus'
import path from 'path'

export interface FilePartsShape {
  line?: number
  column?: number
  absolute: string
  // For when we're merging / creating the file and might not have the file contents on-disk yet
  // used in the scaffolding
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
        return root.contents || ctx.fs.readFile(root.absolute, 'utf8')
      },
    })

    t.int('line', {
      description: 'If provided, used to specify the line of the file to open in openFileInIDE',
    })

    t.int('column', {
      description: 'If provided, used to specify the column of the file to open in openFileInIDE',
    })
  },
  sourceType: {
    module: __filename,
    export: 'FilePartsShape',
  },
})

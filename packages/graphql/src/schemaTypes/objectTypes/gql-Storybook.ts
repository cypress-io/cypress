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

    t.nonNull.string('fileName', {
      description: `The first part of the file, without extensions (e.g. MySpec)`,
    })
  },
})

export const Storybook = objectType({
  name: 'Storybook',
  description: 'Storybook',
  node: 'storybookRoot',
  definition (t) {
    t.nonNull.string('storybookRoot', {
      description: 'Folder containing storybook configuration files',
    })

    t.nonNull.list.nonNull.field('stories', {
      type: FileParts,
      description: 'List of all Storybook stories',
      resolve: async (source, args, ctx) => {
        return ctx.storybook.getStories()
      },
    })

    t.string('generatedSpec', {
      description: 'Most recent generated spec',
      resolve: (source, args, ctx) => ctx.wizardData.generatedSpec?.relative ?? null,
    })
  },
})

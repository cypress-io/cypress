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

export const GeneratedSpec = objectType({
  name: 'GeneratedSpec',
  definition (t) {
    t.nonNull.string('content', {
      description: 'File content of most recently generated spec.',
    })

    t.nonNull.field('spec', {
      type: FileParts,
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

    t.connectionField('stories', {
      type: FileParts,
      description: 'List of all Storybook stories',
      nodes: (source, args, ctx) => {
        return ctx.storybook.getStories()
      },
    })

    t.field('generatedSpec', {
      type: GeneratedSpec,
      resolve: (src, args, ctx) => {
        const project = ctx.activeProject

        if (!project) {
          return null
        }

        return project.generatedSpec
      },
    })
  },
})

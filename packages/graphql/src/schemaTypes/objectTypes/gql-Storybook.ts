import { objectType } from 'nexus'

export const Storybook = objectType({
  name: 'Storybook',
  description: 'Storybook',
  definition (t) {
    t.boolean('configured', {
      description: 'Whether this is the selected framework bundler',
      resolve: async (source, args, ctx) => !!(await ctx.storybook.storybookInfo),
    })

    t.nonNull.list.nonNull.string('stories', {
      description: 'List of all Storybook stories',
      resolve: async (source, args, ctx) => {
        const storybook = await ctx.storybook.storybookInfo

        if (!storybook) {
          return []
        }

        return storybook.getStories(storybook.storybookRoot, storybook.storyGlobs)
      },
    })

    t.string('generatedSpec', {
      description: 'Most recent generated spec',
      resolve: (source, args, ctx) => ctx.wizardData.generatedSpec?.relative ?? null,
    })
  },
})

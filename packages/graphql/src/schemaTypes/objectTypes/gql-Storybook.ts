import { objectType } from 'nexus'

export const Storybook = objectType({
  name: 'Storybook',
  description: 'Storybook',
  node: 'storybookRoot',
  definition (t) {
    t.nonNull.string('storybookRoot', {
      description: 'Folder containing storybook configuration files',
    })
  },
})

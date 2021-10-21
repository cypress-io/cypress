import { objectType } from 'nexus'

export const Prompts = objectType({
  name: 'Prompts',
  description: 'Details about prompts to be shown in docs menu for a project',
  definition (t) {
    t.string('firstOpened', {
      description: 'When this prompt was first opened by the user',
    })
  },
})

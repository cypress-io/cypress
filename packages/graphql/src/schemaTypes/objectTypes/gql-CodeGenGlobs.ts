import { objectType } from 'nexus'

export const CodeGenGlobs = objectType({
  name: 'CodeGenGlobs',
  description: 'Glob patterns for detecting files for code gen.',
  node: 'component',
  definition (t) {
    t.nonNull.string('component')
    t.nonNull.string('story')
  },
})

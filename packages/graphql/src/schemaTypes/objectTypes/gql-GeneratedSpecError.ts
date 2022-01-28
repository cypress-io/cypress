import { objectType } from 'nexus'

export const GeneratedSpecError = objectType({
  name: 'GeneratedSpecError',
  description: 'Error from generated spec',
  definition (t) {
    t.nonNull.string('fileName')
    t.nonNull.string('erroredCodegenCandidate')
  },
})

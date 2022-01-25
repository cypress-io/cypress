import { objectType } from 'nexus'
import { GeneratedSpecResult } from '../unions'
import { CurrentProject } from './gql-CurrentProject'
import type { FilePartsShape } from './gql-FileParts'

export interface ScaffoldedFileSource {
  status: 'changes' | 'valid' | 'skipped' | 'error'
  description: string
  file: FilePartsShape
}

export const GenerateSpecResponse = objectType({
  name: 'GenerateSpecResponse',
  description: 'Error from generated spec',
  definition (t) {
    t.field('currentProject', {
      type: CurrentProject,
      description: 'The currently opened project',
      resolve: (root, args, ctx) => {
        if (ctx.coreData.currentProject) {
          return ctx.lifecycleManager
        }

        return null
      },
    })

    t.field('generatedSpecResult', {
      type: GeneratedSpecResult,
      description: 'The file that have just been scaffolded or the fileName that errored',
      resolve: (root, args, ctx) => root,
    })
  },
  sourceType: {
    module: __filename,
    export: 'ScaffoldedFileSource',
  },
})

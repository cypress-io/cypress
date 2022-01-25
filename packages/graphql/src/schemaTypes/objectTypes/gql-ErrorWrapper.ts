import type { SerializedError } from '@packages/data-context/src/data'
import { objectType } from 'nexus'
import str from 'underscore.string'

import type { NexusGenEnums } from '../../gen/nxs.gen'
import { ErrorTypeEnum } from '../enumTypes/gql-ErrorTypeEnum'
import { FileParts } from './gql-FileParts'

export interface ErrorWrapperSource {
  title?: string | null
  description: string
  errorType: NexusGenEnums['ErrorTypeEnum']
  originalError?: SerializedError
}

export const ErrorWrapper = objectType({
  name: 'ErrorWrapper',
  description: 'Base error',
  definition (t) {
    t.nonNull.string('title', {
      description: 'Formatted errorType',
      resolve (root) {
        return root.title || str.titleize(root.errorType)
      },
    })

    t.nonNull.field('errorType', {
      type: ErrorTypeEnum,
    })

    t.nonNull.string('description', {
      description: 'The markdown formatted content associated with the ErrorTypeEnum',
    })

    t.nonNull.boolean('isUserCodeError', {
      description: 'Whether the error came from user code, can be used to determine whether to open a stack trace by default',
      resolve (root) {
        return true // !root.originalError?.isCypressErr
      },
    })

    t.field('fileToOpen', {
      type: FileParts,
      description: 'Relative file path to open, if there is one associated with this error',
      resolve (root) {
        if (root.originalError) {
          // todo: parse from stack root.originalError.stack
          // return { absolute: '', line: 0, column: 0 }
          return null
        }

        return null
      },
    })

    t.field('codeFrame', {
      type: ErrorCodeFrame,
    })

    t.boolean('isRetryable', {
      description: 'Whether we can retry the error from the UI',
      resolve () {
        return false
      },
    })

    t.field('originalError', {
      type: OriginalError,
      description: 'The user error thrown, if there is one',
    })
  },
  sourceType: {
    module: __filename,
    export: 'ErrorWrapperSource',
  },
})

export const ErrorCodeFrame = objectType({
  name: 'ErrorCodeFrame',
  definition (t) {
    t.string('filename')
  },
})

export const OriginalError = objectType({
  name: 'OriginalError',
  description: 'Error handled from user code (config / setupNodeEvents)',
  definition (t) {
    t.nonNull.string('name', {
      description: 'The error.',
    })

    t.string('stack')
    t.string('message')
  },
})

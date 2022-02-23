import { stripAnsi, stackUtils } from '@packages/errors'
import { objectType } from 'nexus'
import str from 'underscore.string'

import { ErrorTypeEnum } from '../enumTypes/gql-ErrorTypeEnum'
import { FileParts } from './gql-FileParts'

export const ErrorWrapper = objectType({
  name: 'ErrorWrapper',
  description: 'Base error',
  definition (t) {
    t.nonNull.string('title', {
      description: 'Formatted errorType',
      resolve (source) {
        return source.title || str.humanize(source.cypressError.type)
      },
    })

    t.nonNull.string('errorName', {
      description: 'Name of the error class',
      resolve (source) {
        return source.cypressError.originalError?.name || source.cypressError.name
      },
    })

    t.nonNull.string('errorStack', {
      description: 'The error stack of either the original error from the user',
      resolve (source) {
        return stripAnsi(source.cypressError.stack || '')
      },
    })

    t.nonNull.field('errorType', {
      type: ErrorTypeEnum,
      resolve: (source) => source.cypressError.type,
    })

    t.nonNull.string('description', {
      description: 'The markdown formatted content associated with the ErrorTypeEnum',
      resolve (source) {
        return source.cypressError.messageMarkdown
      },
    })

    t.nonNull.boolean('isUserCodeError', {
      description: 'Whether the error came from user code, can be used to determine whether to open a stack trace by default',
      resolve (source) {
        return !source.cypressError.originalError?.isCypressErr
      },
    })

    t.field('fileToOpen', {
      type: FileParts,
      description: 'Relative file path to open, if there is one associated with this error',
      resolve (source) {
        if (!source.cypressError.originalError?.isCypressErr) {
          const stackLines = stackUtils.getStackLines(source.cypressError.stack ?? '')

          return stackUtils.parseStackLine(stackLines[0] ?? '')
        }

        return null
      },
    })

    t.field('codeFrame', {
      type: ErrorCodeFrame,
      resolve: (source) => {
        if (!source.cypressError.originalError?.isCypressErr) {
          const stackLines = stackUtils.getStackLines(source.cypressError.stack ?? '')

          return { filename: stackUtils.parseStackLine(stackLines[0] ?? '')?.absolute }
        }

        return {
          filename: __filename,
        }
      },
    })

    t.boolean('isRetryable', {
      description: 'Whether we can retry the error from the UI',
      resolve () {
        return false
      },
    })
  },
  sourceType: {
    module: '@packages/errors',
    export: 'ErrorWrapperSource',
  },
})

export const ErrorCodeFrame = objectType({
  name: 'ErrorCodeFrame',
  definition (t) {
    t.string('filename')
  },
})

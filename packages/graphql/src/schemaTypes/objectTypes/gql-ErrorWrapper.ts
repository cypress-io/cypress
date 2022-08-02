import { stripAnsi } from '@packages/errors'
import { objectType } from 'nexus'

import { ErrorTypeEnum } from '../enumTypes/gql-ErrorTypeEnum'
import { CodeFrame } from './gql-CodeFrame'

export const ErrorWrapper = objectType({
  name: 'ErrorWrapper',
  description: 'Base error',
  definition (t) {
    t.nonNull.id('id', {
      description: 'The ID for the error, used to clear the error',
    })

    t.string('title', {
      description: 'Optional title of the error. Used to optionally display a title above the error',
    })

    t.nonNull.string('errorName', {
      description: 'Name of the error class',
      resolve (source) {
        return source.cypressError.originalError?.name || source.cypressError.name
      },
    })

    t.nonNull.string('errorStack', {
      description: 'The error stack of either the original error from the user or from where the internal Cypress error was created',
      resolve (source) {
        return stripAnsi(source.cypressError.stack || '')
      },
    })

    t.nonNull.field('errorType', {
      type: ErrorTypeEnum,
      resolve: (source) => source.cypressError.type ?? 'UNEXPECTED_INTERNAL_ERROR',
    })

    t.nonNull.string('errorMessage', {
      description: 'The markdown formatted content associated with the ErrorTypeEnum',
      resolve (source) {
        return source.cypressError.messageMarkdown ?? source.cypressError.message
      },
    })

    t.nonNull.boolean('isUserCodeError', {
      description: 'Whether the error came from user code, can be used to determine whether to open a stack trace by default',
      resolve (source, args, ctx) {
        return ctx.error.isUserCodeError(source)
      },
    })

    t.field('codeFrame', {
      type: CodeFrame,
      description: 'The code frame to display in relation to the error',
      resolve: (source, args, ctx) => {
        return ctx.error.codeFrame(source).catch(
          // Don't worry if we try to get a non-existent file
          () => null,
        )
      },
    })
  },
  sourceType: {
    module: '@packages/errors',
    export: 'ErrorWrapperSource',
  },
})

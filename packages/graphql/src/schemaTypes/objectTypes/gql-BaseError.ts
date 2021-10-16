import { objectType } from 'nexus'

export interface BaseErrorSource {
  title?: string
  message: string
  stack?: string
}

export const BaseError = objectType({
  name: 'BaseError',
  description: 'Base error',
  definition (t) {
    t.string('title')
    t.string('message')
    t.string('stack')
  },
  sourceType: {
    module: __filename,
    export: 'BaseErrorSource',
  },
})

import { objectType } from 'nexus'

export interface BaseErrorSource {
  header: string
  title?: string
  message: string
  stack?: string
}

export const BaseError = objectType({
  name: 'BaseError',
  description: 'Base error',
  definition (t) {
    t.string('header', {
      description: 'Header message for generic base error component',
    })

    t.string('title')
    t.string('message')
    t.string('stack')
  },
  sourceType: {
    module: __filename,
    export: 'BaseErrorSource',
  },
})

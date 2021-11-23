import { objectType } from 'nexus'

export const ApplicationError = objectType({
  name: 'ApplicationError',
  description: 'Error data for an exception that occurs in the application',
  definition (t) {
    t.string('title')
    t.string('message')
    t.string('stack')
  },
})

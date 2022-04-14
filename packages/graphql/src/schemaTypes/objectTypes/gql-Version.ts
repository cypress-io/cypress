import { objectType } from 'nexus'

export const Version = objectType({
  name: 'Version',
  description: 'Version of Cypress and release date',
  definition (t) {
    t.nonNull.string('id', {
      description: 'unique id',
    })

    t.nonNull.string('version', {
      description: 'Version number (follows semantic versioning)',
    })

    t.nonNull.string('released', {
      description: 'Release date as an iso8601 timestamp',
    })
  },
})

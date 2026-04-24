import { objectType } from 'nexus'

export const AutInspectResponse = objectType({
  name: 'AutInspectResponse',
  description: 'Snapshot of the application-under-test iframe: URL, title, and viewport dimensions.',
  definition (t) {
    t.nonNull.string('url', {
      description: 'Current URL of the AUT iframe.',
    })

    t.string('title', {
      description: 'Document title of the AUT. Null when the AUT is cross-origin and `document.title` is inaccessible.',
    })

    t.nonNull.int('viewportWidth', {
      description: 'Configured viewport width of the AUT iframe in CSS pixels.',
    })

    t.nonNull.int('viewportHeight', {
      description: 'Configured viewport height of the AUT iframe in CSS pixels.',
    })
  },
})

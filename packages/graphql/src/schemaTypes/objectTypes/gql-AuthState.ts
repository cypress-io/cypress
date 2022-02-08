import { objectType } from 'nexus'

export const AuthState = objectType({
  name: 'AuthState',
  description: 'Represents state of auth based on most recent message from login flow',
  definition (t) {
    t.string('type', {
      description: 'The type of the auth message, e.g. info, warning',
    })

    t.nonNull.string('name', {
      description: 'Tame of auth message, e.g. AUTH_BROWSER_LAUNCHED',
    })

    t.nonNull.string('message', {
      description: 'Content of the auth message',
    })

    t.nonNull.boolean('browserOpened', {
      description: 'Whether the browser was successfully opened for login',
    })
  },
})

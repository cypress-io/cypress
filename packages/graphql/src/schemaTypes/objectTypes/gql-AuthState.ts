import { objectType } from 'nexus'

export const AuthState = objectType({
  name: 'AuthState',
  description: 'Represents state of auth based on most recent message from login flow',
  definition (t) {
    t.nonNull.string('type', {
      description: 'The type of the auth state, e.g. info, error',
    })

    t.string('name', {
      description: 'Name of auth state, e.g. AUTH_BROWSER_LAUNCHED',
    })

    t.string('message', {
      description: 'Message for the auth state',
    })

    t.nonNull.boolean('browserOpened', {
      description: 'Whether the browser was successfully opened for login',
    })
  },
})

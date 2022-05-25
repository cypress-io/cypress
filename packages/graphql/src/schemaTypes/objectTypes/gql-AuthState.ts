import { enumType, objectType } from 'nexus'
import { authStateName } from '@packages/types'

export const AuthStateNameEnum = enumType({
  name: 'AuthStateNameEnum',
  members: authStateName,
})

export const AuthState = objectType({
  name: 'AuthState',
  description: 'Represents state of auth based on most recent message from login flow',
  definition (t) {
    t.field('name', {
      type: AuthStateNameEnum,
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

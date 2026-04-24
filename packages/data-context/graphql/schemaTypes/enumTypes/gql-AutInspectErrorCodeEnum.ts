import { enumType } from 'nexus'

export const AutInspectErrorCode = [
  'NOT_IN_STUDIO',
  'TIMEOUT',
  'AUT_UNAVAILABLE',
  'INVALID_SELECTOR',
] as const

export const AutInspectErrorCodeEnum = enumType({
  name: 'AutInspectErrorCode',
  members: AutInspectErrorCode,
})

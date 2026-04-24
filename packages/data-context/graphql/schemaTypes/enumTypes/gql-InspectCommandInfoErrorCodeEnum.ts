import { enumType } from 'nexus'

export const InspectCommandInfoErrorCode = ['NOT_IN_STUDIO', 'LOG_NOT_FOUND', 'TIMEOUT'] as const

export const InspectCommandInfoErrorCodeEnum = enumType({
  name: 'InspectCommandInfoErrorCode',
  members: InspectCommandInfoErrorCode,
})

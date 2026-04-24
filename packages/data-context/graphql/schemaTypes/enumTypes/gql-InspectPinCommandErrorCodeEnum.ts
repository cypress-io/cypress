import { enumType } from 'nexus'

export const InspectPinCommandErrorCode = ['NO_STUDIO_TEST', 'SPEC_RUNNING', 'UNKNOWN_LOG'] as const

export const InspectPinCommandErrorCodeEnum = enumType({
  name: 'InspectPinCommandErrorCode',
  members: InspectPinCommandErrorCode,
})

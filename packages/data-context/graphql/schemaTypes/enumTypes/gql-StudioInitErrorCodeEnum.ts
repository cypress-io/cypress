import { enumType } from 'nexus'

export const StudioInitErrorCode = ['NO_SPEC', 'UNKNOWN_TEST'] as const

export const StudioInitErrorCodeEnum = enumType({
  name: 'StudioInitErrorCode',
  members: StudioInitErrorCode,
})

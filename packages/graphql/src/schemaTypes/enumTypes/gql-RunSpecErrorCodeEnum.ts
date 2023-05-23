import { enumType } from 'nexus'

export const RunSpecErrorCode = ['NO_PROJECT', 'NO_SPEC_PATH', 'NO_SPEC_PATTERN_MATCH', 'TESTING_TYPE_NOT_CONFIGURED', 'SPEC_NOT_FOUND', 'GENERAL_ERROR'] as const

export const RunSpecErrorCodeEnum = enumType({
  name: 'RunSpecErrorCode',
  members: RunSpecErrorCode,
})

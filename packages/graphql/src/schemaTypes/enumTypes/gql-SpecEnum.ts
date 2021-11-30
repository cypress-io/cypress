import { enumType } from 'nexus'

export const SPEC_TYPE = ['component', 'integration'] as const

export type SpecType = typeof SPEC_TYPE[number]

export const SpecTypeEnum = enumType({
  name: 'SpecType',
  members: SPEC_TYPE,
})

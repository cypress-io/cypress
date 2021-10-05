// import { BUNDLERS, FRONTEND_FRAMEWORKS, WIZARD_STEPS } from '@packages/types'

import type { CodegenTypeMap } from '../generated/test-graphql-types.gen'

export type NonCloudTypes = {
  [K in keyof CodegenTypeMap]: K extends `Cloud${string}` ? never : K
}[keyof CodegenTypeMap]

export type ClientTypesWithId = {
  [K in keyof CodegenTypeMap]: 'id' extends keyof CodegenTypeMap[K] ? K extends `Cloud${string}` ? never : K : never
}[keyof CodegenTypeMap]

import type { Config } from 'jest'
// @see https://kulshekhar.github.io/ts-jest/docs for documentation on ts-jest
import { createDefaultPreset } from 'ts-jest'

const tsJestTransformCfg = createDefaultPreset({
  tsconfig: 'tsconfig.test.json',
}).transform

export default async (): Promise<Config> => {
  return {
    testMatch: ['<rootDir>/test/**/*.spec.ts'],
    testEnvironment: 'node',
    transform: {
      ...tsJestTransformCfg,
    },
  }
}

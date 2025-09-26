import type { Config } from 'jest'
// @see https://kulshekhar.github.io/ts-jest/docs for documentation on ts-jest
import { createDefaultPreset } from 'ts-jest'

const tsJestTransformCfg = createDefaultPreset({
  isolatedModules: true,
  tsconfig: 'tsconfig.json',
}).transform

export default async (): Promise<Config> => {
  return {
    // testMatch: ['./test/**/foobar.spec.ts'],
    testMatch: [
      '<rootDir>/test/unit/actions/AuthActions.spec.ts',
      '<rootDir>/test/unit/actions/CodegenActions.spec.ts',
      '<rootDir>/test/unit/actions/CohortsActions.spec.ts',
      '<rootDir>/test/unit/actions/DataEmitterActions.spec.ts',
    ],
    testEnvironment: 'node',
    transform: {
      ...tsJestTransformCfg,
    },
  }
}

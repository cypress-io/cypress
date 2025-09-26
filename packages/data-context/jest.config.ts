import type { Config } from 'jest'
import { createDefaultPreset } from 'ts-jest'

const tsJestTransformCfg = createDefaultPreset({
  isolatedModules: true,
}).transform

export default async (): Promise<Config> => {
  return {
    testMatch: ['./test/**/*.spec.ts'],
    testEnvironment: 'node',
    transform: {
      ...tsJestTransformCfg,
    },
  }
}

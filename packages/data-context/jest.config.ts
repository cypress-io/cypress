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
      '<rootDir>/test/unit/actions/EventCollectorActions.spec.ts',
      '<rootDir>/test/unit/actions/LocalSettingsActions.spec.ts',
      '<rootDir>/test/unit/actions/NotificationActions.spec.ts',
      '<rootDir>/test/unit/actions/ProjectActions.spec.ts',
      '<rootDir>/test/unit/codegen/code-generator.spec.ts',
      '<rootDir>/test/unit/codegen/spec-options.spec.ts',
      '<rootDir>/test/unit/data/ProjectConfigIpc.spec.ts',
      '<rootDir>/test/unit/data/ProjectConfigManager.spec.ts',
      '<rootDir>/test/unit/data/ProjectLifecycleManager.spec.ts',
      '<rootDir>/test/unit/polling/poller.spec.ts',
      '<rootDir>/test/unit/sources/BrowserDataSource.spec.ts',
      '<rootDir>/test/unit/sources/CloudDataSource.spec.ts',
      '<rootDir>/test/unit/sources/GitDataSource_unit.spec.ts',
      '<rootDir>/test/unit/sources/FileDataSource.spec.ts',
      '<rootDir>/test/unit/sources/GitDataSource.spec.ts',
      '<rootDir>/test/unit/sources/GraphQLDataSource.spec.ts',
      '<rootDir>/test/unit/sources/ProjectDataSource.spec.ts',
      '<rootDir>/test/unit/sources/RelevantRunsDataSource.spec.ts',
      '<rootDir>/test/unit/sources/RelevantRunSpecsDataSource.spec.ts',
      '<rootDir>/test/unit/sources/RecentRunsDataSource.spec.ts',
      '<rootDir>/test/unit/sources/RemoteRequestDataSource.spec.ts',
      '<rootDir>/test/unit/sources/VersionsDataSource.spec.ts',
      '<rootDir>/test/unit/sources/WizardDataSource.spec.ts',
      '<rootDir>/test/unit/util/DocumentNodeBuilder.spec.ts',
      '<rootDir>/test/unit/util/hasTypescript.spec.ts',
      '<rootDir>/test/unit/util/testCounts.spec.ts',
    ],
    testEnvironment: 'node',
    transform: {
      ...tsJestTransformCfg,
    },
  }
}

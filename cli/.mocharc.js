module.exports = {
  // hardcoding the spec file names as they will be converted 1 by 1 to vitest
  spec: [
    'test/lib/exec/info.spec.ts',
    'test/lib/exec/open.spec.ts',
    'test/lib/exec/run.spec.ts',
    'test/lib/exec/spawn.spec.ts',
    'test/lib/exec/versions.spec.ts',
    'test/lib/exec/xvfb.spec.ts',
    'test/lib/tasks/cache.spec.ts',
    'test/lib/tasks/dependency.spec.ts',
    'test/lib/tasks/download.spec.ts',
    'test/lib/tasks/install.spec.ts',
    'test/lib/tasks/state.spec.ts',
    'test/lib/tasks/unzip.spec.ts',
    'test/lib/tasks/verify.spec.ts',
    'test/lib/build.spec.ts',
    'test/lib/cli.spec.ts',
    'test/lib/cypress.spec.ts',
    'test/lib/errors.spec.ts',
    'test/lib/logger.spec.ts',
    'test/lib/util.spec.ts',
  ],
  timeout: 10000,
  reporter: 'spec',
  recursive: true
} 
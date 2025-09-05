import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/lib/exec/info.spec.ts',
      'test/lib/exec/open.spec.ts',
      'test/lib/exec/run.spec.ts',
      'test/lib/exec/spawn.spec.ts',
      'test/lib/exec/versions.spec.ts',
      'test/lib/exec/xvfb.spec.ts',

      'test/lib/util.spec.ts',
      'test/lib/logger.spec.ts',
      'test/lib/errors.spec.ts',
      'test/lib/cypress.spec.ts',
    ],
  },
})

import systemTests from '../lib/system-tests'

describe('esm project', () => {
  systemTests.setup()

  systemTests.it('can run in esm projects', {
    project: 'esm-project',
    spec: 'app_spec.js',
    config: {
      video: false,
    },
  })
})

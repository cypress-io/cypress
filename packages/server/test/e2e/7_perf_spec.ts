import e2e from '../support/helpers/e2e'

describe('performance test', () => {
  e2e.it('perf check', {
    spec: 'perf_spec.js',
    timeout: 60000,
    headed: true,
  })
})

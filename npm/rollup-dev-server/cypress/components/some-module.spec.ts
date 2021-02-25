import { someModule } from './some-module'

describe('With no imports', () => {
  it('hot reloads when a dep is changed', () => {
    const val = someModule()

    expect(val).to.eq('This is a module')
  })
})

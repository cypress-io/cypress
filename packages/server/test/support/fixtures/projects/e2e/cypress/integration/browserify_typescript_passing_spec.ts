// @ts-ignore
import foo from '../../lib/foo'
import bar from '../../lib/bar'
import dom from '../../lib/dom'

describe('imports work', () => {
  it('foo coffee', () => {
    // @ts-ignore
    expect(foo()).to.eq('foo')
  })

  it('bar babel', () => {
    // @ts-ignore
    expect(bar()).to.eq('baz')
  })

  it('dom jsx', () => {
    // @ts-ignore
    expect(dom).to.eq('dom')
  })
})

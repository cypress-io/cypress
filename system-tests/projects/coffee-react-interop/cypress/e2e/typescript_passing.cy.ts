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

  // Check if typescript transpiles iterator correctly in ES5.
  // https://github.com/cypress-io/cypress/issues/7098
  it('issue 7098', () => {
    let x = [...Array(100).keys()].map((x) => `${x}`)

    // @ts-ignore
    expect(x[0]).to.eq('0')
  })
})

import css from './fixtures/style.css?inline'
import svg from './fixtures/image.svg?raw'

describe('asset types', () => {
  it('does not transform style assets', () => {
    expect(css).to.contain('import')
    expect(css).not.to.contain('_cypress')
  })

  it('does not transform image assets', () => {
    expect(svg).to.contain('import')
    expect(svg).not.to.contain('_cypress')
  })
})

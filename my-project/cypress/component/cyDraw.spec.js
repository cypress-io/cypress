import { cyDraw } from '../../src/draw'

describe('cyDraw', () => {
  beforeEach(() => {
    document.body.outerHTML = ''
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)
  })

  it('renders', () => {
    cyDraw('#root')
  })
})
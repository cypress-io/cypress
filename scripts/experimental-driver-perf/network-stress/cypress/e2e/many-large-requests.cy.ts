import { stressNetwork } from '../support/intercepts'
import type { Style } from '../support/intercepts'
import { MB } from '../support/load'

describe('many large requests', () => {
  const styles: Style[] = ['none', 'spy', 'response-handler']

  styles.forEach((style) => {
    it(`50 parallel 1MB responses, ${style}`, () => {
      stressNetwork({ count: 50, bytes: MB, concurrency: 6 }, style)
    })
  })

  styles.forEach((style) => {
    it(`20 parallel 5MB responses, ${style}`, () => {
      stressNetwork({ count: 20, bytes: 5 * MB, concurrency: 6 }, style)
    })
  })

  it('20 parallel 1MB uploads, request-handler', () => {
    stressNetwork({ count: 20, bytes: MB, concurrency: 6, upload: true }, 'request-handler')
  })
})
